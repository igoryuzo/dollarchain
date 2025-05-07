import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Create a singleton Neynar client
const neynarApiKey = process.env.NEYNAR_API_KEY || '';
export const neynarClient = new NeynarAPIClient({ apiKey: neynarApiKey });

// Helper function to format error responses
export function formatNeynarError(error: unknown): string {
  if (
    typeof error === 'object' && 
    error !== null && 
    'response' in error && 
    error.response && 
    typeof error.response === 'object' && 
    'data' in error.response && 
    error.response.data && 
    typeof error.response.data === 'object' && 
    'errors' in error.response.data && 
    Array.isArray(error.response.data.errors) && 
    error.response.data.errors.length > 0 &&
    typeof error.response.data.errors[0] === 'object' &&
    'message' in error.response.data.errors[0] &&
    typeof error.response.data.errors[0].message === 'string'
  ) {
    return error.response.data.errors[0].message;
  } else if (
    typeof error === 'object' && 
    error !== null && 
    'message' in error && 
    typeof error.message === 'string'
  ) {
    return error.message;
  } else {
    return 'Unknown error from Neynar API';
  }
}

// Function to send notifications to users via Neynar
export async function sendNotificationsViaNeynar(
  targetFids: number[],
  title: string,
  body: string,
  targetUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!targetFids.length) {
    return { success: false, message: 'No target FIDs provided' };
  }

  try {
    await neynarClient.publishFrameNotifications({
      targetFids,
      notification: {
        title,
        body,
        target_url: targetUrl,
      },
    });

    return {
      success: true,
      message: `Notifications sent successfully`,
    };
  } catch (error) {
    console.error('Error sending notifications via Neynar:', error);
    return {
      success: false,
      message: formatNeynarError(error),
    };
  }
}

// Neynar API helper functions
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// Log API key existence (not the actual key)
console.log('[NeynarAPI] API Key exists:', !!NEYNAR_API_KEY);
console.log('[NeynarAPI] API Key length:', NEYNAR_API_KEY?.length || 0);

// Simple cache to store follower counts and avoid repeated API calls
const followerCache: Record<number, { count: number, timestamp: number }> = {};
// Cache expiration time (12 hours in milliseconds)
const CACHE_EXPIRY = 12 * 60 * 60 * 1000;
// Queue for rate limiting
const pendingRequests: Array<{ fid: number, resolve: (count: number) => void }> = [];
let processingQueue = false;

// Process API requests one by one with a delay
async function processQueue() {
  console.log('[NeynarAPI] Processing queue with', pendingRequests.length, 'pending requests');
  if (processingQueue || pendingRequests.length === 0) return;
  
  processingQueue = true;
  
  while (pendingRequests.length > 0) {
    const request = pendingRequests.shift();
    if (!request) continue;
    
    console.log(`[NeynarAPI] Processing request for FID ${request.fid} from queue`);
    try {
      const count = await fetchFollowerCountFromApi(request.fid);
      console.log(`[NeynarAPI] Got follower count for FID ${request.fid}: ${count}`);
      request.resolve(count);
    } catch (error) {
      console.error(`[NeynarAPI] Error in queue for FID ${request.fid}:`, error);
      request.resolve(0);
    }
    
    // Add a delay to respect rate limits (300ms between requests)
    console.log('[NeynarAPI] Waiting 300ms before next request');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('[NeynarAPI] Queue processing complete');
  processingQueue = false;
}

// Direct API call without caching or rate limiting
async function fetchFollowerCountFromApi(fid: number): Promise<number> {
  console.log(`[NeynarAPI] Making direct API call for FID ${fid}`);
  try {
    // For testing, return a fake follower count if no API key is available
    if (!NEYNAR_API_KEY) {
      console.warn('[NeynarAPI] No API key available, returning mock data');
      return Math.floor(Math.random() * 1000); // Random follower count for testing
    }
    
    const apiUrl = `https://api.neynar.com/v2/farcaster/user?fid=${fid}`;
    console.log(`[NeynarAPI] Fetching from ${apiUrl}`);
    
    const response = await fetch(
      apiUrl,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      }
    );
    
    console.log(`[NeynarAPI] Response status for FID ${fid}:`, response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch follower count: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[NeynarAPI] Successfully parsed JSON for FID ${fid}`);
    
    if (!data.user) {
      console.error(`[NeynarAPI] No user data in response for FID ${fid}:`, data);
      return 0;
    }
    
    return data.user.follower_count || 0;
  } catch (error) {
    console.error(`[NeynarAPI] Error fetching follower count for FID ${fid}:`, error);
    return 0;
  }
}

// Fetch follower count with caching and rate limiting
export async function getFollowerCount(fid: number): Promise<number> {
  console.log(`[NeynarAPI] getFollowerCount called for FID ${fid}`);
  
  // Check cache first
  const cachedData = followerCache[fid];
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY) {
    console.log(`[NeynarAPI] Cache hit for FID ${fid}, returning ${cachedData.count}`);
    return cachedData.count;
  }
  
  console.log(`[NeynarAPI] Cache miss for FID ${fid}, queuing request`);
  
  // If not in cache or expired, queue up a request
  return new Promise((resolve) => {
    pendingRequests.push({ fid, resolve: (count) => {
      // Update cache with new value
      followerCache[fid] = { count, timestamp: now };
      resolve(count);
    }});
    
    // Start processing the queue if it's not already running
    if (!processingQueue) {
      console.log('[NeynarAPI] Starting queue processing');
      processQueue();
    } else {
      console.log('[NeynarAPI] Queue already processing, request added to queue');
    }
  });
}

// Get profile URL for Warpcast
export function getWarpcastProfileUrl(username: string): string {
  return `https://warpcast.com/${username}`;
}

export async function sendWelcomeNotification(fid: number) {
  const notification = {
    title: "🎉 Welcome!",
    body: "Thanks for adding our Mini App on Farcaster!",
    target_url: "https://your-frame-domain.com/", // Change to your app's URL
  };

  const response = await neynarClient.publishFrameNotifications({
    targetFids: [fid],
    notification,
  });

  console.log("Neynar notification response:", response);
  return response;
} 
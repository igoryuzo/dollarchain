import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Initialize the Neynar client with API key
export const getNeynarClient = (): NeynarAPIClient | null => {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    
    if (!apiKey) {
      console.error('Neynar API key is missing');
      return null;
    }
    
    return new NeynarAPIClient({ apiKey });
  } catch (error) {
    console.error('Failed to initialize Neynar client:', error);
    return null;
  }
};

// Send a notification to a single user
export const sendNotification = async (
  fid: number,
  title: string,
  body: string,
  targetUrl?: string
): Promise<boolean> => {
  try {
    const client = getNeynarClient();
    if (!client) {
      console.error('Neynar client not initialized');
      return false;
    }
    
    const notification = {
      title,
      body,
      target_url: targetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    };

    const response = await client.publishFrameNotifications({
      targetFids: [fid],
      notification,
    });
    
    console.log(`Notification sent to FID ${fid}:`, response);
    return true;
  } catch (error) {
    console.error(`Error sending notification to FID ${fid}:`, error);
    return false;
  }
};

// Send a notification to multiple users
export const sendBulkNotifications = async (
  fids: number[],
  title: string,
  body: string,
  targetUrl?: string
): Promise<boolean> => {
  try {
    if (!fids.length) {
      console.warn('No FIDs provided for bulk notification');
      return false;
    }

    const client = getNeynarClient();
    if (!client) {
      console.error('Neynar client not initialized');
      return false;
    }

    const notification = {
      title,
      body,
      target_url: targetUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    };

    const response = await client.publishFrameNotifications({
      targetFids: fids,
      notification,
    });
    
    console.log(`Bulk notification sent to ${fids.length} users:`, response);
    return true;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return false;
  }
};

// Get user profile information via direct API call
export const getUserProfile = async (fid: number) => {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.error('Neynar API key is missing');
      return null;
    }
    
    // Direct fetch to the Neynar API
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user?fid=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error fetching user profile for FID ${fid}:`, error);
    return null;
  }
};

// Define an interface for the user data structure
export interface NeynarUser {
  object: string;
  fid: number;
  username: string;
  display_name?: string;
  custody_address?: string;
  pfp_url?: string;
  profile?: {
    bio?: {
      text?: string;
      mentioned_profiles?: Record<string, unknown>[];
      mentioned_profiles_ranges?: { start: number; end: number }[];
      mentioned_channels?: Record<string, unknown>[];
      mentioned_channels_ranges?: { start: number; end: number }[];
    };
    location?: {
      latitude?: number;
      longitude?: number;
      address?: {
        city?: string;
        state?: string;
        state_code?: string;
        country?: string;
        country_code?: string;
      };
    };
  };
  follower_count: number;
  following_count?: number;
  verifications?: string[];
  verified_addresses?: {
    eth_addresses?: string[];
    sol_addresses?: string[];
    primary?: {
      eth_address?: string;
      sol_address?: string;
    };
  };
  verified_accounts?: {
    platform: string;
    username: string;
  }[];
  power_badge?: boolean;
  experimental?: {
    deprecation_notice?: string;
    neynar_user_score?: number;
  };
  score?: number;
  viewer_context?: {
    following?: boolean;
    followed_by?: boolean;
    blocking?: boolean;
    blocked_by?: boolean;
  };
  // For other properties that may exist
  [key: string]: unknown;
}

// Get user data with follower count for one or more FIDs
export const getUsersWithFollowerCount = async (fids: number[]): Promise<NeynarUser[] | null> => {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.error('Neynar API key is missing');
      return null;
    }
    
    // Use Neynar v2 API to fetch bulk user data including follower count
    const fidsParam = fids.join(',');
    console.log(`🔍 NEYNAR API CALL: Fetching data for FIDs: ${fidsParam}`);
    
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsParam}`, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Always log the complete raw API response
    console.log(`📊 NEYNAR API COMPLETE RESPONSE:`, JSON.stringify(data, null, 2));
    
    // Log each individual user with clear formatting
    if (data.users && data.users.length > 0) {
      data.users.forEach((user: Record<string, unknown>) => {
        console.log(`👤 NEYNAR USER [FID ${user.fid as number}]:`, JSON.stringify(user, null, 2));
      });
    } else {
      console.log(`⚠️ NEYNAR API: No users found for FIDs: ${fidsParam}`);
    }
    
    return data.users;
  } catch (error) {
    console.error(`❌ NEYNAR API ERROR:`, error);
    return null;
  }
};

// Get Neynar data for waitlist users without logging sensitive information
export const getWaitlistUsersNeynarData = async (fids: number[]): Promise<NeynarUser[] | null> => {
  try {
    console.log(`[NEYNAR DEBUG] getWaitlistUsersNeynarData called with ${fids.length} FIDs`);
    
    if (!fids.length) {
      console.log('[NEYNAR DEBUG] No FIDs provided for waitlist users');
      return null;
    }

    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.error('[NEYNAR DEBUG] Neynar API key is missing');
      return null;
    }
    
    // Use Neynar v2 API to fetch bulk user data
    const fidsParam = fids.join(',');
    console.log(`[NEYNAR DEBUG] Fetching Neynar data for ${fids.length} waitlist users`);
    console.log(`[NEYNAR DEBUG] API request URL: https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsParam}`);
    console.log(`[NEYNAR DEBUG] API key present: ${apiKey ? 'Yes' : 'No'}`);
    
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsParam}`, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey
      }
    });
    
    console.log(`[NEYNAR DEBUG] API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NEYNAR DEBUG] API error details: ${errorText}`);
      throw new Error(`Failed to fetch waitlist user data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[NEYNAR DEBUG] API response parsed successfully`);
    
    if (!data.users) {
      console.log(`[NEYNAR DEBUG] No users property in API response`);
      console.log(`[NEYNAR DEBUG] API response structure: ${JSON.stringify(Object.keys(data))}`);
      return [];
    }
    
    if (data.users.length === 0) {
      console.log(`[NEYNAR DEBUG] API returned empty users array`);
      return [];
    }
    
    console.log(`[NEYNAR DEBUG] Received ${data.users.length} users from Neynar API (requested ${fids.length})`);
    
    if (data.users.length !== fids.length) {
      console.warn(`[NEYNAR DEBUG] Warning: Received fewer users than requested`);
      
      // Check which FIDs are missing
      const returnedFids = data.users.map((user: NeynarUser) => user.fid);
      const missingFids = fids.filter(fid => !returnedFids.includes(fid));
      console.log(`[NEYNAR DEBUG] Missing FIDs: ${missingFids.join(', ')}`);
    }
    
    console.log(`[NEYNAR DEBUG] Successfully fetched ${data.users.length} Neynar user profiles for waitlist users`);
    return data.users;
  } catch (error) {
    console.error(`[NEYNAR DEBUG] Error fetching Neynar data for waitlist users:`, error);
    return null;
  }
}; 
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
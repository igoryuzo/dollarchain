// Define notification categories
export type NotificationCategory = 'welcome' | 'test' | 'update';

// Send notification to users
export async function sendNotification(
  targetFids: number[],
  category: NotificationCategory
): Promise<{ success: boolean; message: string }> {
  try {
    if (!targetFids.length) {
      return {
        success: false,
        message: 'No users to notify',
      };
    }

    // Basic validation
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured');
    }

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetFids,
        category,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to send notification',
      };
    }

    return {
      success: true,
      message: `Sent to ${data.sentTo || 0} users`,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send a welcome notification to a user
export async function sendWelcomeNotification(
  fid: number
): Promise<{ success: boolean; message: string }> {
  return sendNotification([fid], 'welcome');
}

// Send a test notification to a user
export async function sendTestNotification(
  fid: number
): Promise<{ success: boolean; message: string }> {
  return sendNotification([fid], 'test');
} 
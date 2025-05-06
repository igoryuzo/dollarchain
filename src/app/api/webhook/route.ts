import { NextResponse } from 'next/server';
import { sendWelcomeNotification } from '@/lib/notifications';

// This is a backup webhook endpoint that logs events
// The primary webhook handling is done by Neynar
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Log the webhook event
    console.log('Webhook event received:', JSON.stringify(payload));
    
    // Handle different event types
    if (payload.type === 'frame_added') {
      const fid = payload.fid;
      
      if (fid) {
        // Send welcome notification when a user adds the frame
        try {
          await sendWelcomeNotification(fid);
          console.log(`Welcome notification sent to FID: ${fid}`);
        } catch (notificationError) {
          console.error('Error sending welcome notification:', notificationError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 
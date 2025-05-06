import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // Since Neynar doesn't have a direct method to delete a notification token,
    // we handle this by cleaning up in our database or logging the request
    // The token would naturally be removed when the user removes the app on their client
    
    // Log the token removal request for audit purposes
    console.log(`Notification token removal requested for FID: ${fid}`);
    
    // Return success even though we didn't directly delete the token
    return NextResponse.json({
      success: true,
      message: `Notification token removal logged for user ${fid}`
    });
    
  } catch (error) {
    console.error('Error in delete-notification-token route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { sendTestNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // Send a test notification
    const result = await sendTestNotification(fid);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 
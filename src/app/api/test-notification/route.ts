import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/neynar';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { success: false, message: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // Send a test notification using Neynar
    const success = await sendNotification(
      fid,
      '🪙 Dollarchain Test',
      'This is a test notification from Dollarchain',
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dollarchain.xyz'}/notification`
    );

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test notification sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test notification' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 
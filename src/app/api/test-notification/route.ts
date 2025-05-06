import { NextResponse } from 'next/server';
import { sendNotificationsViaNeynar } from '@/lib/neynar';

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
    const result = await sendNotificationsViaNeynar(
      [fid],
      '🪙 DollarChain Test',
      'This is a test notification from DollarChain',
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dollarchain.xyz'}/notification`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 
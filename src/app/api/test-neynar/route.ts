import { NextResponse } from 'next/server';
import { getUsersWithFollowerCount } from '@/lib/neynar';

export async function GET(request: Request) {
  try {
    // Get the FID from the query string
    const url = new URL(request.url);
    const fid = url.searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }
    
    // Call Neynar directly to get the raw user data
    console.log(`TEST ENDPOINT: Fetching raw Neynar data for FID ${fid}`);
    const users = await getUsersWithFollowerCount([parseInt(fid, 10)]);
    
    return NextResponse.json({
      success: true,
      raw_neynar_data: users
    });
  } catch (error) {
    console.error('Error in test-neynar endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Neynar' },
      { status: 500 }
    );
  }
} 
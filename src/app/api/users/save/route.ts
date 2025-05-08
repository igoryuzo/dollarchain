import { NextResponse } from 'next/server';
import { saveUser } from '@/lib/supabase';
import { getUsersWithFollowerCount } from '@/lib/neynar';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Basic validation
    if (!userData || !userData.fid || !userData.username) {
      return NextResponse.json(
        { error: 'Missing required user data' },
        { status: 400 }
      );
    }
    
    // Fetch follower count from Neynar
    let followerCount = 0;
    try {
      const users = await getUsersWithFollowerCount([userData.fid]);
      if (users && users.length > 0) {
        followerCount = users[0].follower_count || 0;
      }
    } catch (error) {
      console.error(`Error fetching follower count for FID ${userData.fid}:`, error);
      // Continue even if we can't get follower count
    }
    
    // Save to Supabase - explicitly set waitlist to false for new users and include follower count
    const result = await saveUser({
      fid: userData.fid,
      username: userData.username,
      avatar_url: userData.avatar_url,
      waitlist: false, // Explicitly set to false for new users
      follower_count: followerCount,
    });
    
    return NextResponse.json({ success: true, user: result.data });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { error: 'Failed to save user' },
      { status: 500 }
    );
  }
} 
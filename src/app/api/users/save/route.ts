import { NextResponse } from 'next/server';
import { saveUser } from '@/lib/supabase';
import { getUsersWithFollowerCount } from '@/lib/neynar';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    // Check if user already exists to preserve their waitlist status
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('waitlist')
      .eq('fid', userData.fid)
      .single();
    
    // Save to Supabase - only set waitlist to false for new users
    const result = await saveUser({
      fid: userData.fid,
      username: userData.username,
      avatar_url: userData.avatar_url,
      waitlist: existingUser ? existingUser.waitlist : false, // Preserve waitlist status for existing users
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
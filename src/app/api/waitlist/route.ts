import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all users who have joined the waitlist
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('fid, username, avatar_url, created_at, follower_count, neynar_score')
      .eq('waitlist', true)
      .order('follower_count', { ascending: false })
      .limit(150);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      users: data 
    });
  } catch (error) {
    console.error('Error fetching waitlist users:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist users' },
      { status: 500 }
    );
  }
} 
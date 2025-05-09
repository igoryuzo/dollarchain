import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWaitlistUsersNeynarData } from '@/lib/neynar';

export async function GET() {
  try {
    // Get all users who have joined the waitlist
    const { data: waitlistUsers, error } = await supabaseAdmin
      .from('users')
      .select('fid')
      .eq('waitlist', true)
      .order('follower_count', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${waitlistUsers.length} waitlist users in database`);
    
    if (waitlistUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        raw_neynar_data: [] 
      });
    }
    
    // Extract FIDs
    const fids = waitlistUsers.map(user => user.fid);
    
    // Use the new function to fetch all waitlist users Neynar data
    const neynarUsers = await getWaitlistUsersNeynarData(fids);
    
    if (!neynarUsers) {
      throw new Error('Failed to fetch Neynar user data');
    }
    
    console.log(`Successfully fetched ${neynarUsers.length} Neynar user profiles`);
    
    return NextResponse.json({ 
      success: true, 
      raw_neynar_data: neynarUsers 
    });
  } catch (error) {
    console.error('Error fetching waitlist users with Neynar data:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist users with Neynar data' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWaitlistUsersNeynarData } from '@/lib/neynar';

export async function GET() {
  console.log('[WAITLIST-NEYNAR] API route handler started');
  try {
    // Get all users who have joined the waitlist
    console.log('[WAITLIST-NEYNAR] Querying database for waitlist users');
    const { data: waitlistUsers, error } = await supabaseAdmin
      .from('users')
      .select('fid')
      .eq('waitlist', true)
      .order('follower_count', { ascending: false });
    
    if (error) {
      console.error('[WAITLIST-NEYNAR] Database query error:', error);
      throw error;
    }
    
    console.log(`[WAITLIST-NEYNAR] Found ${waitlistUsers?.length || 0} waitlist users in database`);
    
    if (!waitlistUsers || waitlistUsers.length === 0) {
      console.log('[WAITLIST-NEYNAR] No waitlist users found, returning empty array');
      return NextResponse.json({ 
        success: true, 
        raw_neynar_data: [] 
      });
    }
    
    // Extract FIDs
    const fids = waitlistUsers.map(user => user.fid);
    console.log(`[WAITLIST-NEYNAR] Extracted ${fids.length} FIDs`);
    
    // Use the new function to fetch all waitlist users Neynar data
    console.log('[WAITLIST-NEYNAR] Calling getWaitlistUsersNeynarData function');
    const neynarUsers = await getWaitlistUsersNeynarData(fids);
    
    if (!neynarUsers) {
      console.error('[WAITLIST-NEYNAR] getWaitlistUsersNeynarData returned null');
      throw new Error('Failed to fetch Neynar user data');
    }
    
    console.log(`[WAITLIST-NEYNAR] Successfully fetched ${neynarUsers.length} Neynar user profiles`);
    console.log('[WAITLIST-NEYNAR] Returning response with raw Neynar data');
    
    return NextResponse.json({ 
      success: true, 
      raw_neynar_data: neynarUsers 
    });
  } catch (error) {
    console.error('[WAITLIST-NEYNAR] Error fetching waitlist users with Neynar data:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist users with Neynar data' },
      { status: 500 }
    );
  }
} 
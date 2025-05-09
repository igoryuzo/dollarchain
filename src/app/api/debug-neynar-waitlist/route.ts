import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsersWithFollowerCount } from '@/lib/neynar';

export async function GET() {
  console.log('[DEBUG-NEYNAR] Debug API route handler started');
  
  try {
    // Get all users who have joined the waitlist
    console.log('[DEBUG-NEYNAR] Querying database for waitlist users');
    const { data: waitlistUsers, error } = await supabaseAdmin
      .from('users')
      .select('fid')
      .eq('waitlist', true)
      .limit(1); // Limit to 1 for debugging
    
    if (error) {
      console.error('[DEBUG-NEYNAR] Database query error:', error);
      throw error;
    }
    
    console.log(`[DEBUG-NEYNAR] Found ${waitlistUsers?.length || 0} waitlist users in database`);
    
    if (!waitlistUsers || waitlistUsers.length === 0) {
      console.log('[DEBUG-NEYNAR] No waitlist users found, trying with a specific FID');
      
      // If no waitlist users, try with a specific FID that we know exists
      const testFid = 17714; // Use your own FID as a fallback
      console.log(`[DEBUG-NEYNAR] Using test FID: ${testFid}`);
      
      const neynarUsers = await getUsersWithFollowerCount([testFid]);
      
      if (!neynarUsers || neynarUsers.length === 0) {
        console.error('[DEBUG-NEYNAR] Failed to fetch Neynar data even for test FID');
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch Neynar data even for test FID'
        }, { status: 500 });
      }
      
      // Inspect the data structure for the test user
      const testUser = neynarUsers[0];
      console.log('[DEBUG-NEYNAR] Test user keys:', Object.keys(testUser));
      
      return NextResponse.json({
        success: true,
        message: 'Used test FID instead of waitlist users',
        test_user_fid: testFid,
        available_fields: Object.keys(testUser),
        raw_neynar_data: neynarUsers
      });
    }
    
    // Extract FID from the first waitlist user
    const fid = waitlistUsers[0].fid;
    console.log(`[DEBUG-NEYNAR] Using waitlist user FID: ${fid}`);
    
    // Use the direct API call function to get raw data
    const neynarUsers = await getUsersWithFollowerCount([fid]);
    
    if (!neynarUsers || neynarUsers.length === 0) {
      console.error('[DEBUG-NEYNAR] Failed to fetch Neynar data for waitlist user');
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch Neynar data for waitlist user'
      }, { status: 500 });
    }
    
    // Inspect the data structure
    const user = neynarUsers[0];
    console.log('[DEBUG-NEYNAR] User keys:', Object.keys(user));
    
    return NextResponse.json({
      success: true,
      waitlist_user_fid: fid,
      available_fields: Object.keys(user),
      raw_neynar_data: neynarUsers
    });
    
  } catch (error) {
    console.error('[DEBUG-NEYNAR] Error in debug endpoint:', error);
    
    return NextResponse.json(
      { success: false, error: 'Debug endpoint error' },
      { status: 500 }
    );
  }
} 
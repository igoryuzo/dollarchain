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
    let neynarScore: number | undefined = undefined;
    let primaryEthAddress: string | undefined = undefined;
    
    try {
      console.log(`🔄 API ROUTE: Fetching Neynar data for user ${userData.username} (FID: ${userData.fid})`);
      const users = await getUsersWithFollowerCount([userData.fid]);
      
      if (users && users.length > 0) {
        const neynarUser = users[0];
        followerCount = neynarUser.follower_count || 0;
        
        // Extract score (from either location)
        neynarScore = neynarUser.score || 
                     (neynarUser.experimental && neynarUser.experimental.neynar_user_score) || 
                     undefined;
        
        // Extract primary ETH address if available
        if (neynarUser.verified_addresses && 
            neynarUser.verified_addresses.primary && 
            neynarUser.verified_addresses.primary.eth_address) {
          primaryEthAddress = neynarUser.verified_addresses.primary.eth_address;
        }
        
        console.log(`✅ API ROUTE: Successfully fetched Neynar data for FID ${userData.fid}`);
        console.log(`📊 Extracted score: ${neynarScore}, primary ETH: ${primaryEthAddress || 'none'}`);
      } else {
        console.log(`⚠️ API ROUTE: No Neynar data found for FID ${userData.fid}`);
      }
    } catch (error) {
      console.error(`❌ API ROUTE: Error fetching data from Neynar for FID ${userData.fid}:`, error);
      // Continue even if we can't get Neynar data
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
      neynar_score: neynarScore,
      primary_eth_address: primaryEthAddress
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
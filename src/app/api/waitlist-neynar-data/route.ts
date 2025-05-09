import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Define type for Neynar user
type NeynarUser = {
  object: string;
  fid: number;
  username: string;
  display_name?: string;
  custody_address?: string;
  pfp_url?: string;
  profile?: Record<string, unknown>;
  follower_count: number;
  following_count?: number;
  verifications?: string[];
  verified_addresses?: Record<string, unknown>;
  verified_accounts?: Array<{platform: string, username: string}>;
  power_badge?: boolean;
  experimental?: Record<string, unknown>;
  score?: number;
  [key: string]: unknown;
};

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
    
    // Fetch Neynar data for each user
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('Neynar API key is missing');
    }
    
    // We need to fetch users one by one to get complete data
    const neynarUsers: NeynarUser[] = [];
    
    // Use Promise.all to fetch all users in parallel
    await Promise.all(fids.map(async (fid) => {
      try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/user?fid=${fid}`, {
          headers: {
            'accept': 'application/json',
            'api_key': apiKey
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch user data for FID ${fid}: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        if (data.user) {
          neynarUsers.push(data.user as NeynarUser);
          console.log(`Retrieved Neynar data for FID ${fid}`);
        }
      } catch (userError) {
        console.error(`Error fetching Neynar data for FID ${fid}:`, userError);
      }
    }));
    
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
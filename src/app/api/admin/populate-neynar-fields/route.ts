import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUsersWithFollowerCount } from '@/lib/neynar';

// This is an admin-only API route to populate Neynar fields for all users
export async function GET() {
  try {
    console.log('🔄 Starting to populate Neynar fields for all users...');
  
    // Fetch all users from the database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('fid, username')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Found ${users.length} users in the database`);
    
    // Process users in batches to avoid rate limits
    const batchSize = 10;
    const totalBatches = Math.ceil(users.length / batchSize);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, users.length);
      const batch = users.slice(start, end);
      
      console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} users)`);
      
      // Get all FIDs in this batch
      const fids = batch.map(user => user.fid);
      
      // Fetch Neynar data for these users
      const neynarUsers = await getUsersWithFollowerCount(fids);
      
      if (!neynarUsers || neynarUsers.length === 0) {
        console.log(`⚠️ No Neynar data returned for batch ${batchIndex + 1}`);
        continue;
      }
      
      console.log(`✅ Received Neynar data for ${neynarUsers.length} users`);
      
      // Update each user with their Neynar data
      for (const neynarUser of neynarUsers) {
        const fid = neynarUser.fid;
        const username = neynarUser.username;
        
        // Extract score (from either location)
        const neynarScore = neynarUser.score || 
                          (neynarUser.experimental && neynarUser.experimental.neynar_user_score) || 
                          undefined;
        
        // Extract primary ETH address if available
        let primaryEthAddress: string | undefined = undefined;
        if (neynarUser.verified_addresses && 
            neynarUser.verified_addresses.primary && 
            neynarUser.verified_addresses.primary.eth_address) {
          primaryEthAddress = neynarUser.verified_addresses.primary.eth_address;
        }
        
        // Skip update if both fields are undefined
        if (neynarScore === undefined && primaryEthAddress === undefined) {
          console.log(`⚠️ No data to update for user ${username} (FID: ${fid})`);
          skippedCount++;
          continue;
        }
        
        // Update user record
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString()
        };
        
        if (neynarScore !== undefined) {
          updateData.neynar_score = neynarScore;
        }
        
        if (primaryEthAddress !== undefined) {
          updateData.primary_eth_address = primaryEthAddress;
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('fid', fid);
        
        if (updateError) {
          console.error(`❌ Error updating user ${username} (FID: ${fid}):`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated user ${username} (FID: ${fid}) - Score: ${neynarScore || 'none'}, ETH: ${primaryEthAddress || 'none'}`);
          updatedCount++;
        }
      }
      
      // Add a small delay between batches to avoid rate limits
      if (batchIndex < totalBatches - 1) {
        console.log('⏳ Waiting 2 seconds before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('✅ Finished populating Neynar fields for all users!');
    
    return NextResponse.json({
      success: true,
      message: 'Population of Neynar fields completed',
      stats: {
        total: users.length,
        updated: updatedCount,
        skipped: skippedCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Error in populate-neynar-fields API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to populate Neynar fields' 
      },
      { status: 500 }
    );
  }
} 
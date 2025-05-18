import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function extractTeamFids() {
  try {
    console.log('Extracting user_fids for team_id 30...');
    
    // Query deposits table for team_id 30, selecting unique user_fids
    const { data, error } = await supabase
      .from('deposits')
      .select('user_fid')
      .eq('team_id', 30)
      .order('user_fid');
    
    if (error) {
      throw error;
    }
    
    // Extract unique FIDs
    const uniqueFids = [...new Set(data.map(item => item.user_fid))];
    
    console.log(`Found ${uniqueFids.length} unique FIDs for team_id 30`);
    console.log('FIDs array:');
    console.log(JSON.stringify(uniqueFids));
    
    return uniqueFids;
  } catch (err) {
    console.error('Error extracting FIDs:', err);
  }
}

// Execute and print the results
extractTeamFids(); 
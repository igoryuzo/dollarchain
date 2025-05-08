import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular client for user-level operations
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Admin client for privileged operations (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// Save or update user
export async function saveUser(userData: {
  fid: number;
  username: string;
  avatar_url?: string;
  waitlist?: boolean;
  follower_count?: number;
}) {
  // If waitlist is undefined, we need to ensure we don't override the existing value
  const { waitlist, ...otherUserData } = userData;
  
  const updateData = {
    ...otherUserData,
    updated_at: new Date().toISOString(),
  };
  
  // Only include waitlist in the update if it was explicitly provided
  if (waitlist !== undefined) {
    Object.assign(updateData, { waitlist });
  } else {
    // Otherwise, fetch the current value to preserve it
    const { data } = await supabaseAdmin
      .from('users')
      .select('waitlist')
      .eq('fid', userData.fid)
      .single();
      
    if (data) {
      Object.assign(updateData, { waitlist: data.waitlist });
    } else {
      Object.assign(updateData, { waitlist: false });
    }
  }
  
  // Include follower_count with a default of 0 if not provided
  if (updateData.follower_count === undefined) {
    updateData.follower_count = 0;
  }
  
  return supabaseAdmin
    .from('users')
    .upsert(updateData)
    .select();
}

// Get user by FID
export async function getUserByFid(fid: number) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('fid', fid)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
} 
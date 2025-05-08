import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();
    
    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing fid' },
        { status: 400 }
      );
    }

    // Check if user exists first
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('fid')
      .eq('fid', fid)
      .single();
    
    let result;
    
    if (existingUser) {
      // Update existing user
      result = await supabaseAdmin
        .from('users')
        .update({ 
          waitlist: true,
          updated_at: new Date().toISOString()
        })
        .eq('fid', fid);
    } else {
      // We need user data which we don't have, so we'll have to fetch it
      // In a real app, you'd probably want to handle this case differently
      // or ensure users are always created before attempting to update them
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (result.error) {
      throw result.error;
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'User waitlist status updated'
    });
  } catch (error) {
    console.error('Error updating waitlist status:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update waitlist status' },
      { status: 500 }
    );
  }
} 
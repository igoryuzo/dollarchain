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

    // Get user's waitlist status
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('waitlist')
      .eq('fid', fid)
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true,
      waitlist: data?.waitlist || false
    });
  } catch (error) {
    console.error('Error getting waitlist status:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get waitlist status' },
      { status: 500 }
    );
  }
} 
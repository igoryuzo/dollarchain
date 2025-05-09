import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Count users who have joined the waitlist
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('waitlist', true);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      count: count || 0
    });
  } catch (error) {
    console.error('Error fetching waitlist count:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist count' },
      { status: 500 }
    );
  }
} 
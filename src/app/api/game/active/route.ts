import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: game, error } = await supabase
    .from('games')
    .select('id')
    .eq('status', 'active')
    .single();
  if (error || !game) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({ active: true });
} 
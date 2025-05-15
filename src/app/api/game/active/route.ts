import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: game, error } = await supabase
    .from('games')
    .select('id, start_time, end_time, button_active')
    .eq('status', 'active')
    .single();
  if (error || !game) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({ active: true, start_time: game.start_time, end_time: game.end_time, button_active: game.button_active });
} 
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('team_name')
    .not('team_name', 'is', null);

  if (error) {
    return NextResponse.json({ usedNames: [], error: error.message }, { status: 500 });
  }

  const usedNames = (data || []).map((row: { team_name: string }) => row.team_name);
  return NextResponse.json({ usedNames });
} 
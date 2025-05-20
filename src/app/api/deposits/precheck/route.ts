import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to deposit.' }, { status: 400 });
    }
    // No need to parse body since we don't use it
    // Check for primary_eth_address
    const { data: dbUser } = await supabase
      .from('users')
      .select('primary_eth_address')
      .eq('fid', user.fid)
      .single();
    if (!dbUser?.primary_eth_address) {
      return NextResponse.json({ error: 'You must set up your primary wallet before depositing.' }, { status: 400 });
    }
    // Find the current active game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('status', 'active')
      .single();
    if (gameError || !game) {
      return NextResponse.json({ error: 'No active game found.' }, { status: 400 });
    }
    // Enforce global deposit rate limit (across all teams)
    const { data: lastDeposit } = await supabase
      .from('deposits')
      .select('created_at')
      .eq('user_fid', user.fid)
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (lastDeposit) {
      const last = new Date(lastDeposit.created_at).getTime();
      const now = Date.now();
      if (now - last < 60 * 1000) { // 1 minute rule (for testing)
        return NextResponse.json({ error: 'You can only deposit $1 per minute (testing only).' }, { status: 400 });
      }
    }
    // All checks passed
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 
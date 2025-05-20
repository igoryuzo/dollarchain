import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const team_id = req.nextUrl.searchParams.get("team_id");
  if (!team_id) {
    return NextResponse.json({ error: "Missing team_id" }, { status: 400 });
  }
  // Fetch team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", team_id)
    .single();
  if (teamError || !team) {
    return NextResponse.json({ error: teamError?.message || "Team not found" }, { status: 404 });
  }
  // Fetch members with user info
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("user_fid, role, joined_at, users: user_fid (username, avatar_url, follower_count, neynar_score)")
    .eq("team_id", team_id);
  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }
  // Sort: owner first, then by follower_count desc
  const sortedMembers = [...(members || [])].sort((a, b) => {
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    return ((b.users?.[0]?.follower_count || 0) - (a.users?.[0]?.follower_count || 0));
  });
  // Fetch current active game for pot_amount and to filter deposits
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, pot_amount, button_active")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }
  // Fetch all deposits for this team in this game, including created_at
  const { data: deposits } = await supabase
    .from("deposits")
    .select("user_fid, amount, created_at")
    .eq("team_id", team_id)
    .eq("game_id", game.id);

  let teamTotal = 0;
  const depositMap: Record<string, { total: number; lastDeposit: string | null }> = {};
  if (deposits) {
    deposits.forEach(d => {
      const fid = String(d.user_fid);
      if (!depositMap[fid]) {
        depositMap[fid] = { total: 0, lastDeposit: null };
      }
      depositMap[fid].total += d.amount || 0;
      // Track the latest deposit time
      if (!depositMap[fid].lastDeposit || new Date(d.created_at) > new Date(depositMap[fid].lastDeposit)) {
        depositMap[fid].lastDeposit = d.created_at;
      }
      teamTotal += d.amount || 0;
    });
  }

  // Attach total_deposit and last_deposit to each member
  const membersWithDeposit = (sortedMembers || []).map(m => ({
    ...m,
    total_deposit: depositMap[String(m.user_fid)]?.total || 0,
    last_deposit: depositMap[String(m.user_fid)]?.lastDeposit || null
  }));
  return NextResponse.json({ team, members: membersWithDeposit, team_total: teamTotal, pot_amount: game.pot_amount, button_active: game.button_active });
} 
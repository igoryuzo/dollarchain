import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // 1. Find the current active game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, pot_amount, winning_team_id")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }
  // 2. Get all teams for this game, join users for owner username
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, team_name, owner_fid, chain_length, total_points, users:owner_fid (username, avatar_url, follower_count, neynar_score)")
    .eq("game_id", game.id)
    .order("total_points", { ascending: false })
    .order("chain_length", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // For each team, get team_total and members with total_deposit and username
  const teamsWithMembers = [];
  for (const team of teams) {
    // Get all deposits for this team
    const { data: deposits, error: depositsError } = await supabase
      .from("deposits")
      .select("user_fid, amount, users: user_fid (username)")
      .eq("team_id", team.id)
      .eq("game_id", game.id);
    if (depositsError) {
      teamsWithMembers.push({ ...team, team_total: 0, members: [] });
      continue;
    }
    // Sum deposits per user
    const depositMap: Record<string, { user_fid: number; username: string; total_deposit: number }> = {};
    let teamTotal = 0;
    deposits.forEach(d => {
      const fid = d.user_fid;
      const username = d.users?.[0]?.username || '';
      if (!depositMap[fid]) {
        depositMap[fid] = { user_fid: fid, username, total_deposit: 0 };
      }
      depositMap[fid].total_deposit += d.amount || 0;
      teamTotal += d.amount || 0;
    });
    const members = Object.values(depositMap);
    teamsWithMembers.push({ ...team, team_total: teamTotal, members });
  }
  // If there is a winning team, get user deposits for that team
  let winning_team_deposits = null;
  let winning_team_total = null;
  if (game.winning_team_id) {
    // Get each user's total deposit for the winning team
    const { data: userDeposits, error: userDepositsError } = await supabase
      .from("deposits")
      .select("user_fid, amount")
      .eq("team_id", game.winning_team_id)
      .eq("game_id", game.id);
    if (!userDepositsError && userDeposits) {
      // Sum deposits per user
      const depositMap: Record<string, number> = {};
      let teamTotal = 0;
      userDeposits.forEach(d => {
        depositMap[d.user_fid] = (depositMap[d.user_fid] || 0) + (d.amount || 0);
        teamTotal += (d.amount || 0);
      });
      winning_team_deposits = Object.entries(depositMap).map(([user_fid, total_deposit]) => ({ user_fid: Number(user_fid), total_deposit }));
      winning_team_total = teamTotal;
    }
  }
  return NextResponse.json({ teams: teamsWithMembers, pot_amount: game.pot_amount, winning_team_id: game.winning_team_id, winning_team_deposits, winning_team_total });
} 
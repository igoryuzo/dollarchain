import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const user = getServerUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Find the current active game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, pot_amount")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }
  // Find all teams where the user is a member for this game
  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_fid", user.fid);
  if (teamMembersError || !teamMembers || teamMembers.length === 0) {
    return NextResponse.json({ teams: [], pot_amount: game.pot_amount });
  }
  const teamIds = (teamMembers as { team_id: number; role: string }[]).map((tm) => tm.team_id);
  // Fetch teams with leaderboard fields and owner username
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, team_name, owner_fid, chain_length, total_points, chain_multiplier, total_deposits, users:owner_fid (username)")
    .in("id", teamIds)
    .eq("game_id", game.id);
  if (teamsError || !teams) {
    return NextResponse.json({ teams: [], pot_amount: game.pot_amount });
  }
  // For each team, get team_total (sum of deposits for this team in this game)
  const teamsWithTotals = [];
  for (const team of teams) {
    const { data: deposits, error: depositsError } = await supabase
      .from("deposits")
      .select("amount")
      .eq("team_id", team.id)
      .eq("game_id", game.id);
    let team_total = 0;
    if (!depositsError && deposits) {
      team_total = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    }
    // Attach role info
    const member = (teamMembers as { team_id: number; role: string }[]).find((tm) => tm.team_id === team.id);
    teamsWithTotals.push({
      ...team,
      team_total,
      role: member?.role,
    });
  }
  return NextResponse.json({ teams: teamsWithTotals, pot_amount: game.pot_amount });
} 
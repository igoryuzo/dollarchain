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
    .select("*")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }
  // Find the first team where the user is a member for this game
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_fid", user.fid)
    .limit(1)
    .single();
  if (!teamMember) {
    return NextResponse.json({ team: null });
  }
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamMember.team_id)
    .eq("game_id", game.id)
    .single();
  if (!team) {
    return NextResponse.json({ team: null });
  }
  return NextResponse.json({ team });
} 
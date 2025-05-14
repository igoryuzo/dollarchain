import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // 1. Find the current active game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("status", "active")
    .single();
  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }
  // 2. Get all teams for this game, join users for owner username
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, team_name, owner_fid, chain_length, total_points, users:owner_fid(username)")
    .eq("game_id", game.id)
    .order("total_points", { ascending: false })
    .order("chain_length", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ teams });
} 
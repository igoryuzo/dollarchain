import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const user = getUser(); // Get current user (implement as needed)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team_name } = await req.json();

  // 1. Find the current active game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("status", "active")
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "No active game found" }, { status: 400 });
  }

  // 2. Check if user is on waitlist
  const { data: dbUser } = await supabase
    .from("users")
    .select("waitlist")
    .eq("fid", user.fid)
    .single();

  // 3. If not on waitlist, require $1 deposit (for now, just check logic)
  if (!dbUser?.waitlist) {
    // Here you would check payment status or return an error if not paid
    // For now, just return an error
    return NextResponse.json({ error: "Deposit required to start a team" }, { status: 403 });
  }

  // 4. Create the team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      game_id: game.id,
      owner_fid: user.fid,
      team_name,
      is_active: true,
    })
    .select()
    .single();

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  // 5. Add user as team owner in team_members
  await supabase.from("team_members").insert({
    user_fid: user.fid,
    team_id: team.id,
    joined_at: new Date().toISOString(),
    role: "owner",
  });

  return NextResponse.json({ team });
} 
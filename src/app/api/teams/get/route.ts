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
  // Fetch members
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("user_fid, role, joined_at")
    .eq("team_id", team_id);
  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }
  return NextResponse.json({ team, members });
} 
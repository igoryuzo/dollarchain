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
  return NextResponse.json({ team, members: sortedMembers });
} 
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { fid } = await req.json();
  if (!fid) {
    return NextResponse.json({ error: "Missing fid" }, { status: 400 });
  }

  // You can add more checks here (e.g., verify user exists, etc.)

  const res = NextResponse.json({ success: true });
  setAuthCookie(res, { fid });
  return res;
} 
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.error('[CLIENT ERROR]', JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[CLIENT ERROR] Failed to parse error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to log error' }, { status: 400 });
  }
} 
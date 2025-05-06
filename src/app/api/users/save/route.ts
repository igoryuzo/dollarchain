import { NextResponse } from 'next/server';
import { saveUser } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Basic validation
    if (!userData || !userData.fid || !userData.username) {
      return NextResponse.json(
        { error: 'Missing required user data' },
        { status: 400 }
      );
    }
    
    // Save to Supabase
    const result = await saveUser({
      fid: userData.fid,
      username: userData.username,
      avatar_url: userData.avatar_url,
    });
    
    return NextResponse.json({ success: true, user: result.data });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { error: 'Failed to save user' },
      { status: 500 }
    );
  }
} 
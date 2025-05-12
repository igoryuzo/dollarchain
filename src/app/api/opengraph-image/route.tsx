import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getUserByFid } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  let user = null;
  if (fid) {
    user = await getUserByFid(Number(fid));
  }

  const avatarUrl = user?.avatar_url || 'https://www.dollarchain.xyz/default-avatar.png';
  const username = user?.username || 'Dollarchain User';

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative bg-[#263238]">
        <div tw="flex w-72 h-72 rounded-full overflow-hidden mb-8 border-8 border-[#00C853] bg-white">
          <img src={avatarUrl} alt="Profile" tw="w-full h-full object-cover" />
        </div>
        <h1 tw="text-6xl text-white font-bold mb-2">{username}</h1>
        <p tw="text-3xl text-[#00C853] font-semibold">Dollarchain Profile</p>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
} 
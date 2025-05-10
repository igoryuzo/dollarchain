'use client';

import { getUser } from '@/lib/auth';
import Link from 'next/link';

export default function GameBanner() {
  const user = getUser();
  const isTrustedUser = user?.fid === 17714;
  
  const bannerContent = (
    <h3 className="text-lg font-medium">Game Rules Coming Soon</h3>
  );
  
  return (
    <div className="fixed top-0 left-0 right-0 py-3 px-4 bg-[#C1B18B] text-white text-center z-10 shadow-md">
      {isTrustedUser ? (
        <Link href="/launch" className="hover:underline">
          {bannerContent}
        </Link>
      ) : (
        bannerContent
      )}
    </div>
  );
} 
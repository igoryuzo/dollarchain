'use client';

import Link from 'next/link';

export default function GameBanner() {
  return (
    <Link href="/launch">
      <div className="fixed top-0 left-0 right-0 py-3 px-4 bg-[#00C853] text-center z-10 shadow-md cursor-pointer">
        <span className="text-lg font-medium underline text-[#263238]">Game Rules Click Here</span>
      </div>
    </Link>
  );
} 
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

type WaitlistUser = {
  fid: number;
  username: string;
  follower_count: number;
  neynar_score?: number;
  avatar_url?: string;
  created_at: string;
};

type WaitlistUsersProps = {
  refreshTrigger?: number; // A value that when changed, triggers a refresh
};

export default function WaitlistUsers({ refreshTrigger = 0 }: WaitlistUsersProps) {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLSpanElement>(null);

  // Close tooltip on outside click
  useEffect(() => {
    if (!infoOpen) return;
    function handleClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [infoOpen]);

  useEffect(() => {
    const fetchWaitlistUsers = async () => {
      try {
        console.log('[WAITLIST-COMPONENT] Starting to fetch waitlist users');
        setIsLoading(true);
        const response = await fetch('/api/waitlist');
        
        console.log(`[WAITLIST-COMPONENT] API response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch waitlist users: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[WAITLIST-COMPONENT] API response parsed successfully`);
        
        if (data.success && data.users) {
          console.log(`[WAITLIST-COMPONENT] Found ${data.users.length} waitlist users`);
          setUsers(data.users);
        } else {
          console.error(`[WAITLIST-COMPONENT] API response indicated failure: ${data.error || 'No error details provided'}`);
          throw new Error(data.error || 'Failed to fetch waitlist data');
        }
      } catch (err) {
        console.error('[WAITLIST-COMPONENT] Error fetching waitlist users:', err);
        setError('Failed to load waitlist users. Please try again later.');
      } finally {
        setIsLoading(false);
        console.log('[WAITLIST-COMPONENT] Finished fetching waitlist users');
      }
    };

    fetchWaitlistUsers();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (isLoading) {
    return (
      <div className="w-full mt-4">
        <div className="text-center text-gray-500 py-6">
          <div className="animate-pulse flex justify-center items-center">
            <div className="h-3 w-3 bg-gray-300 rounded-full mr-1"></div>
            <div className="h-3 w-3 bg-gray-300 rounded-full mr-1"></div>
            <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
          </div>
          <p className="mt-2 text-sm">Loading waitlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-4">
        <p className="text-center text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full mt-4">
        <p className="text-center text-gray-500 py-6 text-sm">No users have joined the waitlist yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 rounded-md overflow-hidden border border-gray-100">
      <div className="border-b border-gray-100 bg-purple-50 px-4 py-3 text-center">
        <h3 className="text-lg font-medium text-purple-800">Waitlist Members</h3>
        <p className="text-sm text-purple-600 mt-1">Members get a head start.</p>
      </div>
      
      <div className="grid grid-cols-8 gap-2 py-2 px-4 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5">User</div>
        <div className="col-span-2 text-right flex items-center justify-end gap-1">
          Neynar Score
          <span
            ref={infoRef}
            className="relative group cursor-pointer select-none"
            tabIndex={0}
            onClick={() => setInfoOpen((v) => !v)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setInfoOpen(v => !v); }}
            aria-label="What is Neynar Score?"
          >
            {/* Info icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 inline-block ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
            </svg>
            {/* Tooltip: show on hover (desktop) or click (mobile) */}
            <span
              className={`absolute right-0 z-10 w-64 p-2 text-xs text-white bg-gray-900 rounded shadow-lg mt-2
                ${infoOpen ? 'block' : 'hidden'}
                group-hover:block
              `}
              style={{ minWidth: '200px' }}
            >
              Your Neynar score (0–1) reflects your user quality—closer to 1 means higher quality.
            </span>
          </span>
        </div>
      </div>
      
      <ul className="divide-y divide-gray-100">
        {users.map((user, index) => (
          <li key={user.fid} className="hover:bg-gray-50">
            <a
              href={`https://warpcast.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-8 gap-2 items-center px-4 py-3 group"
            >
              <div className="col-span-1 text-center">
                <span className="text-sm text-gray-400 font-medium">{index + 1}</span>
              </div>
              <div className="col-span-5 flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={`${user.username}'s avatar`}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                      unoptimized // Add unoptimized to fix avatar loading issues
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-800 font-bold">
                      {user.username ? user.username.slice(0, 1).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <span className="ml-3 text-sm font-medium text-purple-700 group-hover:text-purple-900">
                  @{user.username}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm text-gray-600">
                  {user.neynar_score ? user.neynar_score.toFixed(2) : '-'}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 
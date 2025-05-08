'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type WaitlistUser = {
  fid: number;
  username: string;
  follower_count: number;
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

  useEffect(() => {
    const fetchWaitlistUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/waitlist');
        
        if (!response.ok) {
          throw new Error('Failed to fetch waitlist users');
        }
        
        const data = await response.json();
        
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          throw new Error(data.error || 'Failed to fetch waitlist data');
        }
      } catch (err) {
        console.error('Error fetching waitlist users:', err);
        setError('Failed to load waitlist users. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlistUsers();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (isLoading) {
    return (
      <div className="w-full mt-4">
        <div className="text-center text-gray-500 py-8">
          <div className="animate-pulse flex justify-center items-center">
            <div className="h-4 w-4 bg-gray-300 rounded-full mr-1"></div>
            <div className="h-4 w-4 bg-gray-300 rounded-full mr-1"></div>
            <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
          </div>
          <p className="mt-2">Loading waitlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-4">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full mt-4">
        <p className="text-center text-gray-500 py-8">No users have joined the waitlist yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">Waitlist Members</h3>
        <p className="text-sm text-gray-500">Members are sorted by follower count</p>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user.fid} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-purple-100 text-purple-800 font-bold">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  {user.username}
                  <a
                    href={`https://warpcast.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-purple-600 hover:text-purple-800"
                  >
                    @{user.username}
                  </a>
                </p>
                <p className="text-xs text-gray-500">
                  FID: {user.fid}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <div className="mr-1">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="font-medium">{user.follower_count.toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 
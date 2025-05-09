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
          console.log(`Fetched ${data.users.length} waitlist users from database:`, data.users);
          // Log each individual user for better visibility
          data.users.forEach((user: WaitlistUser) => {
            console.log(`Waitlist user from DB - FID ${user.fid} (@${user.username}):`, user);
          });
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
      
      <ul className="divide-y divide-gray-100">
        {users.map((user, index) => (
          <li key={user.fid} className="hover:bg-gray-50">
            <a
              href={`https://warpcast.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 group"
            >
              <div className="flex-shrink-0 w-6 text-right mr-3">
                <span className="text-sm text-gray-400 font-medium">{index + 1}</span>
              </div>
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
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
              <div className="ml-3">
                <span className="text-sm font-medium text-purple-700 group-hover:text-purple-900">
                  @{user.username}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 
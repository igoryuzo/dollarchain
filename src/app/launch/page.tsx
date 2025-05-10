'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

export default function LaunchPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated through Warpcast
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl">
        {user ? `hello we are in staging @${user.username}` : 'hello'}
      </h1>
    </div>
  );
} 
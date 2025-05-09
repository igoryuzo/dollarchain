'use client';

import { useState, useEffect } from 'react';

type WaitlistCounterProps = {
  refreshTrigger?: number;
};

export default function WaitlistCounter({ refreshTrigger = 0 }: WaitlistCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/waitlist-count');
        
        if (!response.ok) {
          throw new Error('Failed to fetch waitlist count');
        }
        
        const data = await response.json();
        
        if (data.success && data.count !== undefined) {
          setCount(data.count);
        } else {
          throw new Error(data.error || 'Failed to fetch waitlist count');
        }
      } catch (err) {
        console.error('Error fetching waitlist count:', err);
        setError('Failed to load waitlist count');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlistCount();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="text-center mb-6">
        <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error || count === null) {
    return null;
  }

  const progress = Math.min(100, Math.max(0, (count / 100) * 100));

  return (
    <div className="text-center mb-8">
      <div className="relative h-7 w-40 bg-gray-100 rounded-full overflow-hidden mx-auto">
        <div 
          className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-medium">
          {count} / 100 players
        </div>
      </div>
    </div>
  );
} 
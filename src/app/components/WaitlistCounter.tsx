'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

type WaitlistCounterProps = {
  refreshTrigger?: number;
};

export default function WaitlistCounter({ refreshTrigger = 0 }: WaitlistCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

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

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareError(null);
      
      const result = await sdk.actions.composeCast({ 
        text: "Join Dollarchain, once 100 people are on the waitlist, the game starts!",
        embeds: ["https://warpcast.com/miniapps/7eNXGhDOacyz/dollarchain"]
      });
      
      if (result) {
        setShared(true);
      }
    } catch (err) {
      console.error('Error sharing to Warpcast:', err);
      setShareError('Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mb-6">
        <div className="animate-pulse h-7 w-40 bg-gray-200 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error || count === null) {
    return null;
  }

  const progress = Math.min(100, Math.max(0, (count / 100) * 100));

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3">
        <div className="relative h-7 w-40 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-medium">
            {count} / 100 players
          </div>
        </div>
        
        {shared ? (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Shared
          </div>
        ) : (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center px-3 py-1 border border-purple-300 text-xs font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none"
          >
            {isSharing ? "..." : "Share"}
          </button>
        )}
      </div>
      
      {shareError && (
        <p className="mt-1 text-xs text-red-600">{shareError}</p>
      )}
    </div>
  );
} 
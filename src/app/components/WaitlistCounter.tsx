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
        text: "Join Dollarchain, a social coordination game on Farcaster!",
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

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-5">
        <div className="px-4 py-1 font-medium text-[#85BB65] text-base">
          {count} players on waitlist
        </div>
        
        {shared ? (
          <div className="inline-flex items-center px-3 py-2 rounded-md text-sm bg-[#85BB65] text-white">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Shared
          </div>
        ) : (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-md text-white bg-[#85BB65] hover:bg-opacity-90 focus:outline-none transition-colors"
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
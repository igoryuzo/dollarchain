'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function ShareButton() {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setError(null);
      
      const result = await sdk.actions.composeCast({ 
        text: "Join Dollarchain, once 100 people are on the waitlist, the game starts!",
        embeds: ["https://warpcast.com/miniapps/7eNXGhDOacyz/dollarchain"]
      });
      
      if (result) {
        setShared(true);
      }
    } catch (err) {
      console.error('Error sharing to Warpcast:', err);
      setError('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  if (shared) {
    return (
      <div className="text-center mt-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Shared Successfully
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mt-4">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        {isSharing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sharing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
            Share on Warpcast
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 
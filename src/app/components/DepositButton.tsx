'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { getUser } from '@/lib/auth';

type DepositButtonProps = {
  onDepositSuccess?: () => void; // Callback when deposit is successful
};

export default function DepositButton({ onDepositSuccess }: DepositButtonProps) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [isConfirmingOnchain, setIsConfirmingOnchain] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already on waitlist
  useEffect(() => {
    const checkWaitlistStatus = async () => {
      try {
        const user = getUser();
        if (!user || !user.fid) return;

        const response = await fetch('/api/user/get-waitlist-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fid: user.fid }),
        });

        if (!response.ok) {
          throw new Error('Failed to check waitlist status');
        }

        const data = await response.json();
        setIsOnWaitlist(data.waitlist);
      } catch (error) {
        console.error('Error checking waitlist status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWaitlistStatus();
  }, []);

  const updateWaitlistStatus = async (fid: number, transactionHash: string) => {
    try {
      const response = await fetch('/api/user/update-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fid, transactionHash }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update waitlist status');
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Error updating waitlist status:', error);
      } else {
        setError('Error updating waitlist status');
        console.error('Error updating waitlist status:', error);
      }
      return false;
    }
  };

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);
      setError(null);
      
      const result = await sdk.experimental.sendToken({
        // Base USDC token address
        token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        // 1 USDC (6 decimals)
        amount: "1000000",
        // Dollarchain treasury address
        recipientAddress: "0x638d7b6b585F2e248Ecbbc84047A96FD600e204E"
      });
      
      if (result.success) {
        console.log("🎉 Deposit successful:", result.send.transaction);
        setTransactionHash(result.send.transaction);
        setIsConfirmingOnchain(true);
        // Get the current user
        const user = getUser();
        if (user && user.fid) {
          // Update the user's waitlist status in Supabase, passing the transaction hash
          const success = await updateWaitlistStatus(user.fid, result.send.transaction);
          setIsConfirmingOnchain(false);
          if (success) {
            setIsOnWaitlist(true);
            // Notify parent component that deposit was successful
            if (onDepositSuccess) {
              onDepositSuccess();
            }
          }
        }
      } else {
        console.error("❌ Deposit failed:", result.reason, result.error);
        setError(`Failed to deposit: ${result.reason}`);
      }
    } catch (error) {
      console.error("Error during deposit:", error);
      setError("Need USDC on Warpcast Wallet.");
    } finally {
      setIsDepositing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <div className="animate-pulse w-full py-3 bg-gray-300 rounded-md"></div>
      </div>
    );
  }

  if (isOnWaitlist) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-[#00C853]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <p className="text-md font-medium mb-1">You&apos;re on the waitlist!</p>
        <p className="text-sm text-[#263238]">Thanks for joining!</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-bold text-lg mb-3">Join the waitlist</p>
      <div className="flex flex-col items-center">
        {isConfirmingOnchain ? (
          <div className="text-center text-[#263238] font-medium mb-3 animate-pulse">Confirming onchain...</div>
        ) : transactionHash ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#00C853]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-md font-medium mb-1">Deposit Successful!</p>
            <p className="text-sm text-[#263238]">You&apos;ve joined the waitlist!</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="w-full py-3 bg-[#00C853] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base flex items-center justify-center transition-all"
            >
              {isDepositing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Deposit $1 USDC"
              )}
            </button>
            
            {error && (
              <div className="mt-3 text-red-500 text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 
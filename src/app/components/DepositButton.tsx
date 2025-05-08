'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { getUser } from '@/lib/auth';

type DepositButtonProps = {
  onDepositSuccess?: () => void; // Callback when deposit is successful
};

export default function DepositButton({ onDepositSuccess }: DepositButtonProps) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateWaitlistStatus = async (fid: number) => {
    try {
      const response = await fetch('/api/user/update-waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fid }),
      });

      if (!response.ok) {
        throw new Error('Failed to update waitlist status');
      }

      return true;
    } catch (error) {
      console.error('Error updating waitlist status:', error);
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
        
        // Get the current user
        const user = getUser();
        if (user && user.fid) {
          // Update the user's waitlist status in Supabase
          await updateWaitlistStatus(user.fid);
          
          // Notify parent component that deposit was successful
          if (onDepositSuccess) {
            onDepositSuccess();
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

  return (
    <div className="flex flex-col items-center">
      {transactionHash ? (
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p className="text-md font-medium mb-1">Deposit Successful!</p>
          <p className="text-sm text-gray-500">You&apos;ve joined the waitlist!</p>
        </div>
      ) : (
        <>
          <button
            onClick={handleDeposit}
            disabled={isDepositing}
            className="w-full py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base flex items-center justify-center"
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
  );
} 
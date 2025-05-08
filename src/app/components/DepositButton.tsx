'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function DepositButton() {
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);
      setError(null);
      
      const result = await sdk.experimental.sendToken({
        // Base USDC token address
        token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        // 1 USDC (6 decimals)
        amount: "1000000",
        // DollarChain treasury address - replace with your actual treasury address
        recipientAddress: "0x4fc4b06aAa30E9d41C7857C732CD73B2B0FB2542"
      });
      
      if (result.success) {
        console.log("🎉 Deposit successful:", result.send.transaction);
        setTransactionHash(result.send.transaction);
      } else {
        console.error("❌ Deposit failed:", result.reason, result.error);
        setError(`Failed to deposit: ${result.reason}`);
      }
    } catch (error) {
      console.error("Error during deposit:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {transactionHash ? (
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Deposit Successful!</p>
          <p className="text-sm text-gray-500 mb-4">You&apos;ve joined the DollarChain</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Start Over
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={handleDeposit}
            disabled={isDepositing}
            className="w-full py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center"
          >
            {isDepositing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
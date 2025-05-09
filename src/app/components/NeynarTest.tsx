'use client';

import { useState } from 'react';

// Define the response type
type NeynarTestResponse = {
  success: boolean;
  raw_neynar_data?: Array<{
    fid: number;
    username: string;
    custody_address?: string;
    [key: string]: unknown;
  }>;
  error?: string;
};

export default function NeynarTest() {
  const [fid, setFid] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NeynarTestResponse | null>(null);

  const fetchNeynarData = async () => {
    if (!fid) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/test-neynar?fid=${fid}`);
      const data = await response.json();
      setResult(data);
      console.log(`📊 DIRECT TEST: Neynar data for FID ${fid}:`, data);
    } catch (error) {
      console.error('Error fetching Neynar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-medium mb-2">Test Neynar User Data</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter FID"
          value={fid}
          onChange={(e) => setFid(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1"
        />
        <button
          onClick={fetchNeynarData}
          disabled={isLoading || !fid}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>
      {result && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">
            Check your browser console for complete logs.
            {result.raw_neynar_data?.[0]?.custody_address && (
              <span className="block mt-1 text-green-600">
                Custody Address: {result.raw_neynar_data[0].custody_address}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
} 
"use client"

import { useState } from "react";
import { sdk } from "@farcaster/frame-sdk";
// import { getUser } from "@/lib/auth";

type Team = { id: number; team_name: string; [key: string]: unknown };
type TeamResult = { team?: Team; error?: string } | null;

type DepositResult = { deposit?: unknown; team?: Team; error?: string } | null;

export default function GamePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TeamResult>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTeam = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: "Test Team" }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setResult({ error: err.message });
      } else {
        setResult({ error: String(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!result?.team?.id) return;
    setDepositLoading(true);
    setDepositResult(null);
    setError(null);
    try {
      // 1. Initiate wallet transfer
      const sendResult = await sdk.experimental.sendToken({
        token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
        amount: "1000000", // 1 USDC (6 decimals)
        recipientAddress: "0x638d7b6b585F2e248Ecbbc84047A96FD600e204E"
      });
      if (!sendResult.success) {
        setError(sendResult.reason || "Failed to send USDC");
        setDepositLoading(false);
        return;
      }
      // 2. Send transaction hash to backend
      const res = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: result.team.id, transactionHash: sendResult.send.transaction }),
      });
      const data = await res.json();
      setDepositResult(data);
      if (!res.ok) {
        setError(data.error || "Deposit failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#263238] text-white">
      <h1 className="text-3xl font-bold mb-8">Hello, world! (Game Page)</h1>
      <div className="flex gap-4 mb-4">
        <button
          className="bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150"
          onClick={handleCreateTeam}
          disabled={loading}
        >
          {loading ? "Creating Team..." : "Create Test Team"}
        </button>
      </div>
      {result?.team?.id && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <button
            className="bg-[#0091EA] hover:bg-[#007bb5] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150"
            onClick={handleDeposit}
            disabled={depositLoading}
          >
            {depositLoading ? "Depositing..." : "Deposit $1 USDC"}
          </button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
      )}
      {result && (
        <pre className="bg-[#1e272c] p-4 rounded-lg mt-4 max-w-xl overflow-x-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      {depositResult && (
        <pre className="bg-[#1e272c] p-4 rounded-lg mt-4 max-w-xl overflow-x-auto text-sm">
          {JSON.stringify(depositResult, null, 2)}
        </pre>
      )}
    </div>
  );
} 
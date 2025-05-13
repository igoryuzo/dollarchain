import { useState } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { useSearchParams, useRouter } from "next/navigation";

type Team = { id: number; team_name: string; [key: string]: unknown };
type TeamResult = { team?: Team; error?: string; shareableLink?: string } | null;
type DepositResult = { deposit?: unknown; team?: Team; shareableLink?: string; error?: string } | null;

export default function GamePageInner() {
  const [result, setResult] = useState<TeamResult>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get team_id from URL if present
  const teamId = searchParams.get("team_id") || null;

  // Unified deposit handler
  const handleDeposit = async () => {
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
        body: JSON.stringify({ team_id: teamId, transactionHash: sendResult.send.transaction }),
      });
      const data = await res.json();
      setDepositResult(data);
      if (!res.ok) {
        setError(data.error || "Deposit failed");
      } else {
        setResult(data);
        // If a new team was created, redirect to its shareable link
        if (data.shareableLink && !teamId) {
          router.replace(data.shareableLink);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositLoading(false);
    }
  };

  // Headline logic
  const headline = teamId ? "Join This Team Chain" : "Start A Team Chain";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#263238] text-white">
      <h1 className="text-3xl font-bold mb-8">{headline}</h1>
      <div className="flex flex-col items-center gap-2 mb-4">
        <button
          className="bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150"
          onClick={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? "Depositing..." : "Deposit $1 USDC"}
        </button>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      {depositResult && (
        <pre className="bg-[#1e272c] p-4 rounded-lg mt-4 max-w-xl overflow-x-auto text-sm">
          {JSON.stringify(depositResult, null, 2)}
        </pre>
      )}
      {result && result.shareableLink && (
        <div className="mt-4 text-center">
          <span className="text-green-400">Share your team link: </span>
          <a href={result.shareableLink} className="underline text-blue-400">{result.shareableLink}</a>
        </div>
      )}
    </div>
  );
} 
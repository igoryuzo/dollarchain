import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Team = { id: number; team_name: string; [key: string]: unknown };
type TeamResult = { team?: Team; error?: string; shareableLink?: string } | null;
type DepositResult = { deposit?: unknown; team?: Team; shareableLink?: string; error?: string } | null;

const teamNames = [
  "Cash Cows", "Loose Change", "Stimmy Squad", "Pay Pals", "Coin Lords", "Bill Bros", "Bankrupt Ballers", "Debt Collectors", "Fiscal Fools", "Cha-Ching", "DAO Boys", "Token Bros", "Chain Gang", "Rainmakers", "Gas Hogs", "ETH Heads", "Stake Club", "Coin Goblins", "Dollar Dogs", "Low Effort", "Top Chain", "Big Brain", "Degens United", "Simp Nation", "Liquidity Boys", "Dollar Ducks", "Coin Cats", "Dollar Drama", "Tip Jar", "Rich-ish", "Rug Buds", "Cash Queens", "Budget Babes", "Dolla Divas", "Tip Hogs", "Coin Cuties", "Fee Freaks", "Tax Dodgers", "Satoshi's Angels", "Bear Babes", "Bull Babes", "Rich Girlz", "Broke Icons", "Shmoney Gang", "Chain Smokers", "$1 Direction", "Drake Deposits", "Revenue Rookies", "Net Loss", "Dolla Llamas", "Wallet Weasels", "Coin Coyotes", "Fiat Ferrets", "Stonk Skunks", "Piggy Punks", "Token Tacos", "Risky Pickles", "Vault Vultures", "Rug Rabbits", "Gwei Gals", "Lady Ledgers", "Airdrop Addicts", "Feds Watching", "404 Gains", "KYC Rejects", "Protocol Pimps", "WAGMI Wrecked", "Dump Club", "Bag Holders", "Click Farm", "Chain Freaks", "Real Rekt", "NFA Club", "Max Drawdown", "Refund Gang", "Dust Collectors", "Pool Drainers", "Insane Apez", "Crybabies Club", "NFTy Wifeys", "Pepe Payroll", "Wojak Wealth", "Zoom Out", "Credit Rejects", "Margin Misfits", "Drip Deficit", "Hedge Fundies", "ATM Addicts", "Free Mintz", "Top Signal", "Bottom Callers", "Next Cycle", "Deadbeats Inc", "Doja Dump", "Smokey Snoop", "Zuck Chain", "Gaga Gas", "Ariana Airdrop", "Bad Bunnybags", "Posty Protocol"
];

export default function GamePageInner() {
  const [result, setResult] = useState<TeamResult>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedNames, setUsedNames] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get team_id from URL if present
  const teamId = searchParams.get("team_id") || null;

  // Fetch used team names on mount if starting a new team
  useEffect(() => {
    if (!teamId) {
      fetch("/api/teams/used-names", { credentials: "include" })
        .then(res => res.json())
        .then(data => setUsedNames(data.usedNames || []));
    }
  }, [teamId]);

  function getRandomTeamName() {
    const available = teamNames.filter(name => !usedNames.includes(name));
    if (available.length === 0) {
      // All names used, fallback to random 5-digit number
      return `Team #${Math.floor(10000 + Math.random() * 90000)}`;
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  // Unified deposit handler
  const handleDeposit = async () => {
    console.log('[DEBUG] Deposit button clicked');
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
      console.log('[DEBUG] Wallet transfer result:', sendResult);
      if (!sendResult.success) {
        setError(sendResult.reason || "Failed to send USDC");
        setDepositLoading(false);
        return;
      }
      // 2. Send transaction hash and team name to backend
      const body = !teamId
        ? { team_id: teamId, transactionHash: sendResult.send.transaction, team_name: getRandomTeamName() }
        : { team_id: teamId, transactionHash: sendResult.send.transaction };
      console.log('[DEBUG] About to POST to /api/deposits/create', body);
      const res = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      console.log('[DEBUG] Response from /api/deposits/create:', res);
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
      console.error('[DEBUG] Error in handleDeposit:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositLoading(false);
    }
  };

  // Headline logic
  const headline = teamId ? "Join This Team Chain" : "Start A Team Chain";

  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-16 w-full flex flex-col items-center">
      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center text-[#00C853]">{headline}</h1>
        <div className="flex flex-col items-center gap-2 mb-4">
          <button
            className="block w-full text-center bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-4 rounded-lg text-lg shadow transition-all duration-150"
            onClick={handleDeposit}
            disabled={depositLoading}
          >
            {depositLoading ? "Depositing..." : "Deposit $1 USDC"}
          </button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </div>
        {depositResult && (
          <pre className="bg-[#f5f5f5] text-gray-800 p-4 rounded-lg mt-4 max-w-xl overflow-x-auto text-sm">
            {JSON.stringify(depositResult, null, 2)}
          </pre>
        )}
        {result && result.shareableLink && (
          <div className="mt-4 text-center">
            <span className="text-green-600">Share your team link: </span>
            <a href={result.shareableLink} className="underline text-blue-600">{result.shareableLink}</a>
          </div>
        )}
      </div>
    </main>
  );
} 
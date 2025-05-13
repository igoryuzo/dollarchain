import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { useSearchParams, useRouter } from "next/navigation";

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
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [usedNames, setUsedNames] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get team_id from URL if present
  const teamId = searchParams.get("team_id") || null;

  // On mount, check if user already has a team for the current game
  useEffect(() => {
    async function checkMyTeam() {
      setCheckingTeam(true);
      try {
        const res = await fetch("/api/teams/my-team", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.team && data.team.id) {
            router.replace(`/team/${data.team.id}`);
            return;
          }
        }
      } catch {}
      setCheckingTeam(false);
    }
    // Only check if not joining a team via shared link
    if (!teamId) checkMyTeam();
    else setCheckingTeam(false);
  }, [teamId, router]);

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
      // 2. Send transaction hash and team name to backend
      const body: { team_id: string | null, transactionHash: string, team_name?: string } =
        !teamId
          ? { team_id: teamId, transactionHash: sendResult.send.transaction, team_name: getRandomTeamName() }
          : { team_id: teamId, transactionHash: sendResult.send.transaction };
      const res = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
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

  if (checkingTeam) {
    return <div className="min-h-screen flex items-center justify-center text-white">Checking your team...</div>;
  }

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
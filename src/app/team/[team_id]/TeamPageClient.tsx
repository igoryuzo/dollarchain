"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";

const APP_URL = "https://www.dollarchain.xyz/";

type Team = { id: number; team_name: string; owner_fid: number; [key: string]: unknown };
type Member = { user_fid: number; role: string; joined_at: string };
type DepositResult = { deposit?: unknown; team?: Team; shareableLink?: string; error?: string } | null;

type TeamPageClientProps = {
  teamId: string;
  currentFid: number | null;
};

function ShareTeamButton({ teamName, teamId }: { teamName: string; teamId: string }) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      // Use the team page URL as the embed for Farcaster Frame
      const teamUrl = `${APP_URL}team/${teamId}`;
      await sdk.actions.composeCast({
        text: `Join my Dollarchain team: ${teamName}!`,
        embeds: [teamUrl],
      });
    } catch {
      alert("Failed to open cast composer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150 disabled:opacity-60 mt-4"
      onClick={handleShare}
      disabled={loading}
    >
      {loading ? "Opening Composer..." : "Share Team"}
    </button>
  );
}

export default function TeamPageClient({ teamId, currentFid }: TeamPageClientProps) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Fetch team info and members
  useEffect(() => {
    console.log('[TeamPageClient] useEffect fired', { teamId, currentFid });
    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teams/get?team_id=${teamId}`, { credentials: "include" });
        const data = await res.json();
        console.log('[TeamPageClient] API response:', data);
        if (!res.ok) throw new Error(data.error || "Failed to fetch team");
        setTeam(data.team);
        setMembers(data.members || []);
        if (currentFid) {
          setIsOwner(data.team.owner_fid === currentFid);
          setIsMember((data.members || []).some((m: Member) => m.user_fid === currentFid));
          console.log('[TeamPageClient] currentFid:', currentFid, 'isOwner:', data.team.owner_fid === currentFid, 'isMember:', (data.members || []).some((m: Member) => (m as Member).user_fid === currentFid));
        } else {
          setIsOwner(false);
          setIsMember(false);
          console.log('[TeamPageClient] currentFid is null (not signed in)');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        console.log('[TeamPageClient] setLoading(false)');
      }
    }
    if (teamId) fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, currentFid]);

  useEffect(() => {
    if (!loading && !error) {
      sdk.actions.ready();
    }
  }, [loading, error]);

  // Deposit handler (always to this team)
  const handleDeposit = async () => {
    setDepositLoading(true);
    setDepositResult(null);
    setError(null);
    try {
      const sendResult = await sdk.experimental.sendToken({
        token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "1000000",
        recipientAddress: "0x638d7b6b585F2e248Ecbbc84047A96FD600e204E"
      });
      if (!sendResult.success) {
        setError(sendResult.reason || "Failed to send USDC");
        setDepositLoading(false);
        return;
      }
      setDepositLoading(true); // Show processing state
      const res = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, transactionHash: sendResult.send.transaction }),
        credentials: "include"
      });
      const data = await res.json();
      setDepositResult(data);
      if (!res.ok) {
        setError(data.error || "Deposit failed");
      } else {
        // Refresh team info after deposit to update membership
        await router.refresh();
        // Optionally, re-fetch team data here if router.refresh does not update state
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositLoading(false);
    }
  };

  if (loading) {
    console.log('[TeamPageClient] loading is true, rendering splash');
    return <div className="min-h-screen flex items-center justify-center text-white">Loading team...</div>;
  }
  console.log('[TeamPageClient] loading is false, rendering main UI');
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }
  if (!team) {
    return <div className="min-h-screen flex items-center justify-center text-white">Team not found.</div>;
  }
  if (currentFid === null) {
    // This should never happen in the mini app; log for debugging.
    console.error("[TeamPageClient] currentFid is null - this should not happen in the mini app.");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#263238] text-white">
      <h1 className="text-3xl font-bold mb-4">Team: {team.team_name}</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        <ul className="bg-[#1e272c] rounded-lg p-4 min-w-[300px]">
          {members.length === 0 && <li>No members yet.</li>}
          {members.map((m) => (
            <li key={m.user_fid} className="mb-1">
              FID: {m.user_fid} <span className="text-xs text-gray-400">({m.role})</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-2 text-sm text-gray-400">Your FID: {currentFid ?? 'Not signed in'}</div>
      <div className="flex flex-col items-center gap-2 mb-4">
        <button
          className="bg-[#0091EA] hover:bg-[#007bb5] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150"
          onClick={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? (depositResult ? "Processing tx..." : "Depositing...") : "Deposit $1 USDC"}
        </button>
        {isOwner && <div className="text-green-400 text-sm">You are the team owner.</div>}
        {!isOwner && isMember && <div className="text-blue-400 text-sm">You are a team member.</div>}
        {!isOwner && !isMember && !depositLoading && <div className="text-yellow-400 text-sm">You are not a member of this team.</div>}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      {team && <ShareTeamButton teamName={team.team_name} teamId={teamId} />}
    </div>
  );
} 
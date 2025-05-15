"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";
import Image from 'next/image';

const APP_URL = "https://www.dollarchain.xyz/";

type Team = { id: number; team_name: string; owner_fid: number; [key: string]: unknown };
type Member = {
  user_fid: number;
  role: string;
  joined_at: string;
  users?: { username: string; avatar_url: string; follower_count: number; neynar_score?: number };
  total_deposit: number;
};
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
      className="w-64 bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 rounded-md text-lg shadow-lg transition-all duration-150 mt-4"
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
  const [potAmount, setPotAmount] = useState<number | null>(null);
  const [teamTotal, setTeamTotal] = useState<number | null>(null);

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
        setPotAmount(data.pot_amount ?? null);
        setTeamTotal(data.team_total ?? null);
        if (currentFid) {
          console.log('[TeamPageClient] currentFid:', currentFid, 'isOwner:', data.team.owner_fid === currentFid, 'isMember:', (data.members || []).some((m: Member) => (m as Member).user_fid === currentFid));
        } else {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 w-full px-2">
      <h1 className="text-4xl font-extrabold mb-4 text-center text-[#00C853]">{team.team_name}</h1>
      <div className="flex flex-col items-center gap-2 mb-8">
        <button
          className="w-64 bg-[#0091EA] hover:bg-[#007bb5] text-white font-bold py-3 rounded-md text-lg shadow-lg transition-all duration-150"
          onClick={handleDeposit}
          disabled={depositLoading}
        >
          {depositLoading ? (depositResult ? "Processing tx..." : "Depositing...") : "Deposit $1 USDC"}
        </button>
        {team && <ShareTeamButton teamName={team.team_name} teamId={teamId} />}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      <div className="w-full max-w-xl mt-2 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-800"></h2>
        </div>
        <div className="grid grid-cols-12 gap-1 py-2 px-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 rounded-t-md">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6">User</div>
          <div className="col-span-2 text-right flex items-center justify-end gap-1">
            Score
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>
          </div>
          <div className="col-span-3 text-right">Payout</div>
        </div>
        <ul className="divide-y divide-gray-100 bg-white rounded-b-md">
          {members.map((member, index) => {
            console.log('Rendering member:', member);
            const user = member.users;
            if (!user) {
              console.log('No user found for member:', member);
              return null;
            }
            const isOwner = member.role === 'owner';
            return (
              <li key={member.user_fid} className="hover:bg-gray-50">
                <a
                  href={`https://warpcast.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-12 gap-1 items-center px-2 py-2 group"
                >
                  <div className="col-span-1 text-center">
                    <span className="text-xs text-gray-400 font-medium">{index + 1}</span>
                  </div>
                  <div className="col-span-6 flex items-center">
                    <div className={`h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 ${isOwner ? 'border-2 border-green-400' : ''}`}>
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={`${user.username}'s avatar`}
                          width={32}
                          height={32}
                          className="h-8 w-8 object-cover block"
                          unoptimized
                        />
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center bg-purple-100 text-purple-800 font-bold text-xs">
                          {user.username ? user.username.slice(0, 1).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <span className="ml-2 text-xs font-medium text-purple-700 group-hover:text-purple-900 truncate">
                      @{user.username}
                      <span className={`ml-1 text-xs ${isOwner ? 'text-green-400' : 'text-blue-400'}`}>({isOwner ? 'owner' : 'member'})</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-gray-600">
                      {user.neynar_score !== undefined ? Number(user.neynar_score).toFixed(2) : '-'}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-xs text-green-700 font-bold">
                      {potAmount && teamTotal && member.total_deposit
                        ? `$${(Number(potAmount) * (Number(member.total_deposit) / Number(teamTotal))).toFixed(1)}`
                        : '-'}
                    </span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 
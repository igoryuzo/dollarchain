"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";
import Image from 'next/image';
import { ArrowLeft } from "lucide-react";
import React from 'react';
import { signIn } from '@/lib/auth';

const APP_URL = "https://www.dollarchain.xyz/";

type Team = { id: number; team_name: string; owner_fid: number; [key: string]: unknown };
type Member = {
  user_fid: number;
  role: string;
  joined_at: string;
  users?: { username: string; avatar_url: string; follower_count: number; neynar_score?: number };
  total_deposit: number;
  last_deposit?: string;
};
type DepositResult = { deposit?: unknown; team?: Team; shareableLink?: string; error?: string } | null;

type TeamPageClientProps = {
  teamId: string;
  currentFid: number | null;
};

function UserTagModal({ open, onClose, onConfirm, currentFid }: { open: boolean; onClose: () => void; onConfirm: (users: { username: string }[]) => void; currentFid: number }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ fid: number; username?: string; pfp_url?: string }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setUsers([]);
    setSelected([]);
    fetch(`/api/neynar/replies_and_recasts?fid=${currentFid}&limit=20`)
      .then(res => res.json())
      .then(async data => {
        // Extract unique users from parent_author and mentioned_profiles
        const seen = new Set<number>();
        const userList: { fid: number; username?: string; pfp_url?: string }[] = [];
        type NeynarProfile = { fid: number; username?: string; pfp_url?: string };
        type NeynarCast = {
          parent_author?: { fid?: number };
          mentioned_profiles?: NeynarProfile[];
        };
        (data.casts || []).forEach((cast: NeynarCast) => {
          // 1. Add parent_author (user you replied to)
          if (cast.parent_author && cast.parent_author.fid && cast.parent_author.fid !== currentFid && !seen.has(cast.parent_author.fid)) {
            seen.add(cast.parent_author.fid);
            // Try to get username/pfp_url from mentioned_profiles if available
            let userInfo = null;
            if (cast.mentioned_profiles) {
              userInfo = cast.mentioned_profiles.find((p: NeynarProfile) => p.fid === cast.parent_author!.fid);
            }
            userList.push({
              fid: cast.parent_author.fid,
              username: userInfo?.username,
              pfp_url: userInfo?.pfp_url
            });
          }
          // 2. Add mentioned_profiles
          (cast.mentioned_profiles || []).forEach((profile: NeynarProfile) => {
            if (profile.fid !== currentFid && !seen.has(profile.fid)) {
              seen.add(profile.fid);
              userList.push({ fid: profile.fid, username: profile.username, pfp_url: profile.pfp_url });
            }
          });
        });
        const limitedUsers = userList.slice(0, 10);
        // Find FIDs missing username or pfp_url
        const missingFids = limitedUsers.filter(u => !u.username || !u.pfp_url).map(u => u.fid);
        if (missingFids.length > 0) {
          // Fetch missing profiles in batch
          const resp = await fetch(`/api/neynar/users?fids=${missingFids.join(',')}`);
          const profileData = await resp.json();
          if (profileData.users && Array.isArray(profileData.users)) {
            // Map FID to profile
            const profileMap = new Map<number, { username: string; pfp_url: string }>();
            profileData.users.forEach((user: NeynarProfile) => {
              profileMap.set(user.fid, { username: user.username || '', pfp_url: user.pfp_url || '' });
            });
            // Merge info into userList
            for (const u of limitedUsers) {
              if ((!u.username || !u.pfp_url) && profileMap.has(u.fid)) {
                const info = profileMap.get(u.fid)!;
                u.username = u.username || info.username;
                u.pfp_url = u.pfp_url || info.pfp_url;
              }
            }
          }
        }
        setUsers(limitedUsers);
      })
      .finally(() => setLoading(false));
  }, [open, currentFid]);

  function toggle(fid: number) {
    setSelected(sel => sel.includes(fid) ? sel.filter(f => f !== fid) : sel.length < 10 ? [...sel, fid] : sel);
  }

  function handleConfirm() {
    onConfirm(users.filter(u => selected.includes(u.fid)).map(u => ({ username: u.username || '' })));
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        <h2 className="text-lg font-bold mb-4">Tag users you interacted with before</h2>
        {loading ? <div className="text-center py-8">Loading...</div> : (
          <div className="flex flex-col gap-2 mb-4">
            {users.map(u => (
              <label key={u.fid} className={`flex items-center gap-2 px-3 py-2 rounded border ${selected.includes(u.fid) ? 'border-green-500 bg-green-50' : 'border-gray-200'} cursor-pointer transition-all`}>
                <input type="checkbox" checked={selected.includes(u.fid)} onChange={() => toggle(u.fid)} className="accent-green-500 w-4 h-4" />
                <img src={u.pfp_url || ''} alt={u.username || ''} className="w-7 h-7 rounded-full object-cover" />
                <span className="font-medium text-gray-800">@{u.username}</span>
              </label>
            ))}
          </div>
        )}
        <button onClick={handleConfirm} disabled={selected.length === 0} className="w-full py-2 bg-[#00C853] text-white rounded font-bold disabled:bg-gray-300">Tag & Continue</button>
      </div>
    </div>
  );
}

function ShareTeamButton({ teamId, currentFid }: { teamId: string; currentFid: number }) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const teamUrl = `${APP_URL}team/${teamId}`;

  const handleShare = async () => {
    setModalOpen(true);
  };

  const handleModalConfirm = async (users: { username: string }[]) => {
    setModalOpen(false);
    setLoading(true);
    try {
      const mentions = users.map(u => `@${u.username}`).join(' ');
      const teamUrl = `${APP_URL}team/${teamId}`;
      await sdk.actions.composeCast({
        text: `Join my team—let's win /dollarchain together! 🏆 ${mentions}`.trim(),
        embeds: [teamUrl],
      });
    } catch {
      alert("Failed to open cast composer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="w-64 bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 rounded-md text-lg shadow-lg transition-all duration-150 mt-4"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? "Opening Composer..." : "Share Team"}
      </button>
      {!modalOpen && (
        <button
          className="mt-2 mb-4 text-blue-600 hover:underline text-sm font-medium focus:outline-none"
          style={{ display: 'block' }}
          onClick={async () => {
            await navigator.clipboard.writeText(teamUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copied!' : 'Copy Link & DM'}
        </button>
      )}
      <UserTagModal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleModalConfirm} currentFid={currentFid} />
    </>
  );
}

// Helper to get seconds until next deposit
function getSecondsUntilNextDeposit(lastDeposit: string | null) {
  if (!lastDeposit) return 0;
  const last = new Date(lastDeposit).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - last) / 1000);
  return Math.max(3600 - elapsed, 0);
}

// Timer component for each user
function UserDepositTimer({ lastDeposit }: { lastDeposit: string | null }) {
  const [timer, setTimer] = useState(() => getSecondsUntilNextDeposit(lastDeposit));
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(getSecondsUntilNextDeposit(lastDeposit));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastDeposit]);
  if (timer > 0) {
    const m = Math.floor(timer / 60).toString().padStart(2, '0');
    const s = (timer % 60).toString().padStart(2, '0');
    return <span className="text-xs font-mono text-blue-700">{m}:{s}</span>;
  }
  return <span className="text-xs font-mono text-blue-700">Ready</span>;
}

export default function TeamPageClient({ teamId, currentFid }: TeamPageClientProps) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamTotal, setTeamTotal] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLSpanElement>(null);
  const [buttonActive, setButtonActive] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Close tooltip on outside click
  useEffect(() => {
    if (!infoOpen) return;
    function handleClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [infoOpen]);

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
        setTeamTotal(data.team_total ?? null);
        console.log('[TeamPageClient] button_active from API:', data.button_active);
        setButtonActive(data.button_active !== false);
        console.log('[TeamPageClient] buttonActive state set to:', data.button_active !== false);
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
    console.log('[DEBUG] Deposit button clicked');
    setDepositLoading(true);
    setDepositResult(null);
    setError(null);
    try {
      // 1. Pre-check with backend
      const precheckRes = await fetch('/api/deposits/precheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId }),
        credentials: 'include',
      });
      const precheckData = await precheckRes.json();
      if (!precheckRes.ok) {
        setError(precheckData.error || 'Deposit not allowed.');
        setDepositLoading(false);
        return;
      }
      // 2. Initiate wallet transfer
      const sendResult = await sdk.experimental.sendToken({
        token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "1000000",
        recipientAddress: "0x638d7b6b585F2e248Ecbbc84047A96FD600e204E"
      });
      console.log('[DEBUG] Wallet transfer result:', sendResult);
      if (!sendResult.success) {
        setError(sendResult.reason || "Failed to send USDC");
        setDepositLoading(false);
        return;
      }
      setDepositLoading(true); // Show processing state
      const body = { team_id: teamId, transactionHash: sendResult.send.transaction };
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
        // Refresh team info after deposit to update membership
        await router.refresh();
        // Optionally, re-fetch team data here if router.refresh does not update state
      }
    } catch (err) {
      console.error('[DEBUG] Error in handleDeposit:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositLoading(false);
    }
  };

  // Log when buttonActive changes
  useEffect(() => {
    console.log('[TeamPageClient] Deposit button disabled state:', !buttonActive);
  }, [buttonActive]);

  if (currentFid === null) {
    // Prompt user to sign in
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-2xl font-semibold mb-4">You must be signed in to view this team.</div>
        <button
          className="px-6 py-3 bg-[#00C853] text-white rounded-lg font-bold text-lg shadow hover:bg-[#00b34d] transition-all duration-150"
          disabled={isSigningIn}
          onClick={async () => {
            setIsSigningIn(true);
            try {
              await signIn();
              window.location.reload();
            } finally {
              setIsSigningIn(false);
            }
          }}
        >
          {isSigningIn ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-white text-gray-900 w-full px-2 pb-16 flex flex-col items-center">
      <div className="w-full max-w-xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-600 hover:text-gray-900 mt-4 mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span>Back to Home</span>
        </button>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-extrabold mb-4 text-center text-[#00C853]">{team.team_name}</h1>
          <div className="flex flex-col items-center gap-2 mb-8">
            <button
              className={`w-64 text-white font-bold py-3 rounded-md text-lg shadow-lg transition-all duration-150 ${
                depositLoading || !buttonActive 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#0091EA] hover:bg-[#007bb5]'
              }`}
              onClick={handleDeposit}
              disabled={depositLoading || !buttonActive}
            >
              {depositLoading ? (depositResult ? "Processing tx..." : "Depositing...") : "Deposit $1 USDC"}
            </button>
            {team && typeof currentFid === 'number' && <ShareTeamButton teamId={teamId} currentFid={currentFid} />}
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
                <span
                  ref={infoRef}
                  className="relative group cursor-pointer select-none"
                  tabIndex={0}
                  onClick={() => setInfoOpen((v) => !v)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setInfoOpen(v => !v); }}
                  aria-label="What is Neynar Score?"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-gray-400 inline-block ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                  </svg>
                  <span
                    className={`absolute right-0 z-10 w-64 p-2 text-xs text-white bg-gray-900 rounded shadow-lg mt-2
                      ${infoOpen ? 'block' : 'hidden'}
                      group-hover:block
                    `}
                    style={{ minWidth: '200px' }}
                  >
                    Your Neynar score (0–1) reflects your user quality—closer to 1 means higher quality.
                  </span>
                </span>
              </div>
              <div className="col-span-2 text-center">Next</div>
              <div className="col-span-1 text-right">%</div>
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
                      <div className="col-span-2 text-center">
                        <UserDepositTimer lastDeposit={member.last_deposit || null} />
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-xs text-green-700 font-bold">
                          {teamTotal && member.total_deposit
                            ? `${((member.total_deposit / teamTotal) * 100).toFixed(2)}%`
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
      </div>
    </div>
  );
} 
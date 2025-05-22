'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Team {
  id: number;
  team_name: string;
  owner_fid: number;
  chain_length: number;
  total_points: number;
  users?: { username: string; avatar_url?: string; follower_count?: number; neynar_score?: number };
  members?: { user_fid: number; username: string; total_deposit: number }[];
  team_total?: number;
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [potAmount, setPotAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/teams/leaderboard", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch leaderboard");
        setTeams(data.teams || []);
        setPotAmount(data.pot_amount ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  // Find max chain length for multiplier calculation
  const maxChainLength = teams.reduce((max, t) => Math.max(max, t.chain_length ?? 0), 0);

  function getMultiplier(chainLength: number) {
    if (!maxChainLength || maxChainLength === 0) return 1.0;
    const ratio = chainLength / maxChainLength;
    return Math.max(1.0, 3.5 - 2.5 * ratio);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-16 w-full flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Home</span>
        </button>
        {potAmount !== null && (
          <div className="mb-4 text-2xl font-extrabold text-center">
            <span className="bg-[#00C853] text-white px-4 py-2 rounded-lg shadow">💰 ${Math.floor(Number(potAmount))}</span>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-6 text-center text-[#00C853]">Leaderboard</h1>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full">
          <div className="grid grid-cols-10 gap-1 py-2 px-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 rounded-t-xl">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Team</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-1 text-center">Chain</div>
            <div className="col-span-1 text-center">Multi</div>
            <div className="col-span-2 text-right">Points</div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">{error}</div>
          ) : teams.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">No teams yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100 bg-white rounded-b-xl">
              {teams.map((team, idx) => (
                <li className="hover:bg-gray-50 transition-colors" key={team.id}>
                  <div className="grid grid-cols-10 gap-1 items-center px-2 py-3">
                    <div className="col-span-1 text-center">
                      <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>
                    </div>
                    <div className="col-span-3 font-medium text-purple-700 truncate text-xs">
                      <Link href={`/team/${team.id}`} className="hover:text-purple-900 hover:underline">
                        {team.team_name}
                      </Link>
                    </div>
                    <div className="col-span-2 text-xs text-gray-700 truncate">
                      {team.users && team.users.username ? `@${team.users.username}` : '—'}
                    </div>
                    <div className="col-span-1 text-center text-xs text-gray-600">
                      {team.chain_length ?? '-'}
                    </div>
                    <div className="col-span-1 text-center text-xs text-blue-700 font-mono">
                      {getMultiplier(team.chain_length).toFixed(2)}x
                    </div>
                    <div className="col-span-2 text-right text-xs text-gray-900 font-bold">
                      {team.total_points !== undefined ? Number(team.total_points).toFixed(2) : '-'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
} 
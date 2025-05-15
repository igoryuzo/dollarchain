'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";

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
        console.log('[Leaderboard] API response:', data);
        if (!res.ok) throw new Error(data.error || "Failed to fetch leaderboard");
        setTeams(data.teams || []);
        setPotAmount(data.pot_amount ?? null);
        console.log('[Leaderboard] Set potAmount:', data.pot_amount);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.log('[Leaderboard] Error:', err);
      } finally {
        setLoading(false);
        console.log('[Leaderboard] Loading set to false');
      }
    }
    fetchTeams();
  }, []);

  useEffect(() => {
    console.log('[Leaderboard] Render: loading', loading, 'error', error, 'teams', teams);
  }, [loading, error, teams]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900 w-full py-8">
      {potAmount !== null && (
        <div className="mb-4 text-2xl font-extrabold text-center">
          <span className="bg-[#00C853] text-white px-4 py-2 rounded-lg shadow">💰 ${Math.floor(Number(potAmount))}</span>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2 text-[#00C853]">Leaderboard</h1>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-9 gap-2 py-2 px-4 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 rounded-t-md">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">Team Name</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-1 text-center">Chain Length</div>
          <div className="col-span-1 text-right">Points</div>
          <div className="col-span-1 text-right">Potential Payout</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">{error}</div>
        ) : teams.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400">No teams yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white rounded-b-md">
            {teams.map((team, idx) => (
              <li className="hover:bg-gray-50" key={team.id}>
                <div className="grid grid-cols-9 gap-2 items-center px-4 py-3">
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-400 font-medium">{idx + 1}</span>
                  </div>
                  <div className="col-span-3 font-semibold text-purple-700 truncate">
                    <Link href={`/team/${team.id}`} className="hover:text-purple-900 hover:underline">
                      {team.team_name}
                    </Link>
                  </div>
                  <div className="col-span-2 text-sm text-gray-700 truncate">
                    {team.users && team.users.username ? `@${team.users.username}` : '—'}
                  </div>
                  <div className="col-span-1 text-center text-sm text-gray-600">
                    {team.chain_length ?? '-'}
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-900 font-bold">
                    {team.total_points ?? '-'}
                  </div>
                  <div className="col-span-1 text-right text-green-700 font-bold">
                    {team.team_total && potAmount && team.team_total > 0
                      ? `${Math.round(((Number(potAmount) - Number(team.team_total)) / Number(team.team_total)) * 100)}%`
                      : '-'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 
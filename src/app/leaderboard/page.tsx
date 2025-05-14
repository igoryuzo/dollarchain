'use client';
import React, { useEffect, useState } from "react";

interface Team {
  id: number;
  team_name: string;
  owner_fid: number;
  chain_length: number;
  total_points: number;
  users?: { username: string }[];
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
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
        console.log('[Leaderboard] Set teams:', data.teams);
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
      <h1 className="text-3xl font-bold mb-6 text-[#00C853]">Leaderboard</h1>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-8 gap-2 py-2 px-4 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 rounded-t-md">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">Team Name</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-1 text-center">Chain</div>
          <div className="col-span-1 text-right">Points</div>
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
              <li key={team.id} className="hover:bg-gray-50">
                <div className="grid grid-cols-8 gap-2 items-center px-4 py-3">
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-400 font-medium">{idx + 1}</span>
                  </div>
                  <div className="col-span-3 font-semibold text-purple-700 truncate">
                    {team.team_name}
                  </div>
                  <div className="col-span-2 text-sm text-gray-700 truncate">
                    {team.users && team.users[0]?.username ? `@${team.users[0].username}` : '—'}
                  </div>
                  <div className="col-span-1 text-center text-sm text-gray-600">
                    {team.chain_length ?? '-'}
                  </div>
                  <div className="col-span-1 text-right text-sm text-gray-900 font-bold">
                    {team.total_points ?? '-'}
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
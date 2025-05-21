"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface UserTeam {
  id: number;
  team_name: string;
  users?: { username: string };
  owner_fid: number;
  chain_length: number;
  total_points: number;
  team_total: number;
  chain_multiplier?: number;
  role: string;
}

export default function MyTeamsPage() {
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [potAmount, setPotAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/teams", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch your teams");
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

  useEffect(() => {
    fetch('/api/game/active')
      .then(res => res.json())
      .then(data => {
        setGameActive(!!data.button_active);
      })
      .catch(() => setGameActive(false));
  }, []);

  // Check if user is owner of any team
  const isOwner = teams.some(team => team.role === 'owner');

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
        {/* Start Chain button if not owner of any team */}
        {!isOwner && (
          <a
            href={gameActive ? "/game" : undefined}
            className={`block w-full text-center font-bold py-4 rounded-lg text-lg shadow transition-all duration-150 mb-6 ${gameActive ? 'bg-[#00C853] hover:bg-[#00b34d] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'}`}
            tabIndex={gameActive ? 0 : -1}
            aria-disabled={!gameActive}
          >
            Start Chain
          </a>
        )}
        <h1 className="text-3xl font-bold mb-2 text-center text-[#00C853]">Your Teams</h1>
        <div className="text-center text-gray-500 text-sm mb-6">Click on team name to deposit.</div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full">
          <div className="grid grid-cols-10 gap-1 py-2 px-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100 rounded-t-xl">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Team</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-1 text-center">Chain</div>
            <div className="col-span-2 text-right">Points</div>
            <div className="col-span-1 text-right">%</div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">{error}</div>
          ) : teams.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400">You are not a member of any teams yet.</div>
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
                    <div className="col-span-2 text-right text-xs text-gray-900 font-bold">
                      {team.total_points !== undefined ? Number(team.total_points).toFixed(2) : '-'}
                    </div>
                    <div className="col-span-1 text-right text-xs text-green-700 font-bold">
                      {team.team_total && potAmount && team.team_total > 0
                        ? `${Number(((Number(potAmount) - Number(team.team_total)) / Number(team.team_total)) * 100).toFixed(1)}%`
                        : '-'}
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
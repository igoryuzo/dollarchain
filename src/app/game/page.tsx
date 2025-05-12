"use client"

import { useState } from "react";
import { getUser } from "@/lib/auth";

type Team = { id: number; team_name: string; [key: string]: unknown };
type TeamResult = { team?: Team; error?: string } | null;

export default function GamePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TeamResult>(null);
  const user = typeof window !== 'undefined' ? getUser() : null;

  const handleCreateTeam = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: "Test Team" }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setResult({ error: err.message });
      } else {
        setResult({ error: String(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#263238] text-white">
      <h1 className="text-3xl font-bold mb-8">Hello, world! (Game Page)</h1>
      {user?.fid === 17714 && (
        <button
          className="bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150 mb-4"
          onClick={handleCreateTeam}
          disabled={loading}
        >
          {loading ? "Creating Team..." : "Create Test Team"}
        </button>
      )}
      {result && (
        <pre className="bg-[#1e272c] p-4 rounded-lg mt-4 max-w-xl overflow-x-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
} 
"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, DollarSign, Trophy, Users } from "lucide-react"
import { sdk } from "@farcaster/frame-sdk"
// import { getUser } from "../../lib/auth"

// const APP_URL = "https://www.dollarchain.xyz/"

export default function GameRules() {
  const [expandedSection, setExpandedSection] = useState<string | null>("overview")

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <div className="min-h-screen bg-[#263238] text-white font-sans">
      {/* Header */}
      <header className="bg-[#00C853] text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-2xl font-bold text-center">Dollarchain Rules</h1>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto">
        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <button
            className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white"
            onClick={() => toggleSection("overview")}
          >
            <div className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              <span className="font-bold">Game Overview</span>
            </div>
            {expandedSection === "overview" ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSection === "overview" && (
            <div className="p-4 animate-fadeIn">
              <p className="mb-3">
                Dollarchain is a social coordination game where teams compete to earn the most points within 48 hours.
              </p>
              <p className="mb-3">
                The team with the highest score on the leaderboard when the game ends wins all deposited money.
              </p>
              <div className="bg-[#2c3a41] p-3 rounded-md mb-3">
                <p className="font-semibold text-[#00C853]">Game Duration: 48 hours</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <button
            className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white"
            onClick={() => toggleSection("teams")}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              <span className="font-bold">Team Formation</span>
            </div>
            {expandedSection === "teams" ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSection === "teams" && (
            <div className="p-4 animate-fadeIn">
              <p className="mb-3">Players deposit $1 to start a new team chain:</p>
              <ul className="list-disc pl-5 mb-3 space-y-2">
                <li>If you joined the waitlist, you can start a new team chain for free and get a multiplier bonus</li>
                <li>After you start a team chain, you can invite others to join and deposit $1 to make the team chain longer</li>
                <li>At the end of 48 hours, the team chain with the most deposits wins all deposited money and game restarts</li>
              </ul>
            </div>
          )}
        </div>

        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <button
            className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white"
            onClick={() => toggleSection("deposits")}
          >
            <div className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              <span className="font-bold">Deposits</span>
            </div>
            {expandedSection === "deposits" ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSection === "deposits" && (
            <div className="p-4 animate-fadeIn">
              <p className="mb-3">
                Players can deposit a maximum of $1 per hour for the entire 48-hour game duration to any chain.
              </p>
              <div className="bg-[#2c3a41] p-3 rounded-md">
                <p className="font-semibold text-[#00C853]">Max Deposit: $1 per hour</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <button
            className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white"
            onClick={() => toggleSection("multipliers")}
          >
            <div className="flex items-center">
              <span className="mr-2 font-bold text-lg">×</span>
              <span className="font-bold">Multiplier Tiers</span>
            </div>
            {expandedSection === "multipliers" ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSection === "multipliers" && (
            <div className="p-4 animate-fadeIn">
              <p className="mb-3">Shorter chains receive higher multipliers to incentivize deposits:</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#00C853] text-white">
                      <th className="p-2 text-left border border-[#1e272c]">Chain Size</th>
                      <th className="p-2 text-left border border-[#1e272c]">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#2c3a41]">
                      <td className="p-2 border border-[#1e272c]">1-5 deposits</td>
                      <td className="p-2 border border-[#1e272c] font-bold">×5</td>
                    </tr>
                    <tr className="bg-[#263238]">
                      <td className="p-2 border border-[#1e272c]">6-10 deposits</td>
                      <td className="p-2 border border-[#1e272c] font-bold">×3</td>
                    </tr>
                    <tr className="bg-[#2c3a41]">
                      <td className="p-2 border border-[#1e272c]">11-15 deposits</td>
                      <td className="p-2 border border-[#1e272c] font-bold">×2</td>
                    </tr>
                    <tr className="bg-[#263238]">
                      <td className="p-2 border border-[#1e272c]">16+ deposits</td>
                      <td className="p-2 border border-[#1e272c] font-bold">×1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Point System Section */}
        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <div className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white">
            <div className="flex items-center">
              <span className="font-bold">Point System</span>
            </div>
          </div>
          <div className="p-4 animate-fadeIn">
            <p className="mb-3">Each deposit earns points based on the following formula:</p>
            <div className="bg-[#2c3a41] p-4 rounded-md flex flex-col items-center">
              <span className="text-3xl font-mono text-white mb-2">$1 deposit × Chain Size Multiplier × Neynar Score</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1e272c] rounded-lg shadow-lg overflow-hidden mb-4">
          <button
            className="w-full p-4 flex justify-between items-center bg-[#00C853] text-white"
            onClick={() => toggleSection("simulation")}
          >
            <div className="flex items-center">
              <span className="mr-2 font-bold text-lg">📊</span>
              <span className="font-bold">Simulation</span>
            </div>
            {expandedSection === "simulation" ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSection === "simulation" && (
            <div className="p-4 animate-fadeIn">
              <p className="mb-3">Simulation for 100 team chains over the 48-hour game period:</p>

              <div className="rounded-lg overflow-hidden shadow-lg mb-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Top%2010%20Chain%20Weighted%20Values%20Over%20Time%20%28100%20Chains%29-IxLK6k9hcqyl0haPYT6aZ9LHsI57XJ.png"
                  alt="Top 10 Chain Weighted Values Over Time (100 Chains)"
                  className="w-full"
                />
              </div>

              <p className="text-sm text-gray-300">
                This chart is a theoretical simulation of how the game would play out over 48 hours with 100 team chains. The closer the chains are the more competitive the game is.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Join
            <button
              type="button"
              className="underline text-[#00C853] hover:text-[#00b34d] ml-1 cursor-pointer bg-transparent border-none p-0"
              onClick={async (e) => {
                e.preventDefault();
                await sdk.actions.openUrl("https://warpcast.com/~/channel/dollarchain");
              }}
            >
              /dollarchain
            </button>
            channel for updates & feedback.
          </p>
        </div>
      </main>
      {/*
      <div className="fixed bottom-0 left-0 w-full bg-[#1e272c] p-4 flex justify-center shadow-inner z-20">
        <ShareProfileButton />
      </div>
      */}
    </div>
  )
}

/*
function ShareProfileButton() {
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    setLoading(true)
    try {
      const user = getUser()
      if (!user || !user.fid) {
        alert("User not authenticated.")
        setLoading(false)
        return
      }
      const imageUrl = `${APP_URL}/api/opengraph-image?fid=${user.fid}`
      await sdk.actions.composeCast({
        text: "Check out my Dollarchain profile!",
        embeds: [imageUrl],
      })
    } catch {
      alert("Failed to open cast composer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="bg-[#00C853] hover:bg-[#00b34d] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-150 disabled:opacity-60"
      onClick={handleShare}
      disabled={loading}
    >
      {loading ? "Opening Composer..." : "Share Profile"}
    </button>
  )
}
*/ 
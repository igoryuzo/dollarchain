"use client"

import { useState } from "react"
import { Users, Link, Trophy, Clock, BarChart, ArrowLeft, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GameRules() {
  const router = useRouter()
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen)
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 max-w-md mx-auto">
      <header className="mb-8">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-2xl font-bold mb-2">How to Play</h1>
        <p className="text-gray-600">Dollarchain is a 48-hour social coordination game.</p>
      </header>

      <section className="space-y-6">
        {/* Core Rules */}
        <div className="space-y-4">
          {ruleItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border border-gray-100 rounded-lg">
              <div className="bg-gray-50 p-2 rounded-full">{item.icon}</div>
              <div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Rules Accordion */}
        <div className="border-b">
          <button 
            onClick={toggleAccordion}
            className="flex w-full items-center justify-between py-4 text-sm font-medium"
          >
            Advanced Rules
            <ChevronDown 
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isAccordionOpen && (
            <div className="pb-4">
              <ul className="space-y-2 text-sm text-gray-600 pl-2">
                <li>• Shorter chains get multipliers to stay competitive</li>
                <li>• Neynar score affects point calculation</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

const ruleItems = [
  {
    icon: <Users size={20} />,
    title: "Join or Create a Team",
    description: "Deposit $1 USDC to join or start a new team.",
  },
  {
    icon: <Link size={20} />,
    title: "Share Your Link",
    description: "Invite others to join your chain by sharing your team link.",
  },
  {
    icon: <BarChart size={20} />,
    title: "Earn Points",
    description: "Longer chains and more deposits earn your team more points.",
  },
  {
    icon: <Clock size={20} />,
    title: "Deposit Regularly",
    description: "You can deposit $1 every hour during the 48-hour game.",
  },
  {
    icon: <Trophy size={20} />,
    title: "Win the Pot",
    description: "Teams compete for a share of all deposited USDC.",
  },
] 
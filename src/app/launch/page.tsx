"use client"

import { Users, Link, Trophy, Clock, BarChart } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function GameRules() {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 max-w-md mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">How to Play</h1>
        <p className="text-gray-600">A simple guide to the chain game</p>
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

        {/* Additional Details */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm font-medium">More Details</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm text-gray-600 pl-2">
                <li>• Game duration: 48 hours</li>
                <li>• Deposit limit: $1 USDC per hour</li>
                <li>• Shorter chains get multipliers to stay competitive</li>
                <li>• Neynar score affects point calculation</li>
                <li>• All deposits go into the prize pot</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
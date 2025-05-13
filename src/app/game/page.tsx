"use client";
import { Suspense } from "react";
import GamePageInner from "../game/GamePageInner";

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageInner />
    </Suspense>
  );
} 
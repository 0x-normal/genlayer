"use client";

import { useState, useEffect } from "react";

const PHASES = [
  "Sending all rounds to GenLayer...",
  "AI Validators reading your submissions...",
  "Judges deliberating across all rounds...",
  "Calculating scores holistically...",
  "Reaching consensus on final rankings...",
  "Almost there — finalizing verdicts...",
];

const FACTS = [
  "Multiple AI validators independently score each player across all their rounds...",
  "Validators must reach consensus — if scores differ too much, they re-evaluate...",
  "GenLayer's Optimistic Democracy ensures fair, decentralized judging...",
];

export default function ConsensusLoader() {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  const phase = elapsed < 5 ? 0 : elapsed < 15 ? 1 : elapsed < 30 ? 2 : elapsed < 50 ? 3 : elapsed < 80 ? 4 : 5;
  const fact = elapsed < 20 ? FACTS[0] : elapsed < 45 ? FACTS[1] : FACTS[2];
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#a855f7]/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Spinning validators */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-2 border-[#fbbf24]/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[#fbbf24] rounded-full animate-spin" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-3 border-2 border-transparent border-b-[#a855f7] rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-6 border-2 border-transparent border-t-[#22d3ee] rounded-full animate-spin" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#fbbf24] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Phase text */}
        <div className="text-center">
          <div className="text-sm font-mono text-white/50 tracking-wider mb-2">
            {PHASES[phase]}{dots}
          </div>
          <div className="text-[10px] font-mono text-white/20 tracking-wider">
            Optimistic Democracy Consensus
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full">
          <div className="w-1.5 h-1.5 bg-[#a855f7] rounded-full animate-pulse" />
          <span className="text-xs font-mono text-white/30 tabular-nums">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>

        {/* Fact */}
        <div className="max-w-sm text-center px-6">
          <div className="text-[10px] font-mono text-white/15 tracking-wider leading-relaxed">
            {fact}
          </div>
        </div>
      </div>
    </div>
  );
}
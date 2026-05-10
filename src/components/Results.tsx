"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import type { JudgingResult, PitchResult } from "@/lib/genlayer";

interface ResultsProps {
  result: JudgingResult;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  onHome: () => void;
}

const RANK_EMOJI = ["🏆", "🥈", "🥉", "💀", "💀", "💀"];
const RANK_COLORS = ["#fbbf24", "#94a3b8", "#cd7f32", "#6b7280", "#6b7280", "#6b7280"];

function ScoreBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-white/30 w-24 text-right uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: visible ? `${value * 10}%` : "0%",
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
      <span
        className="text-sm font-bold font-mono tabular-nums w-8 text-right transition-all duration-500"
        style={{ color, opacity: visible ? 1 : 0 }}
      >
        {value}
      </span>
    </div>
  );
}

function PlayerCard({ result, rank, isMe, delay }: { result: PitchResult; rank: number; isMe: boolean; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const color = RANK_COLORS[rank - 1] || "#6b7280";
  const addr = result.address;
  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div
      className={`w-full max-w-lg transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div
        className={`relative px-6 py-5 rounded-xl border transition-all ${
          isMe
            ? "bg-[#fbbf24]/[0.04] border-[#fbbf24]/30"
            : "bg-white/[0.02] border-white/[0.06]"
        }`}
        style={rank === 1 ? { boxShadow: `0 0 40px ${color}15` } : {}}
      >
        {/* Rank badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{RANK_EMOJI[rank - 1]}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color }}>
                  #{rank}
                </span>
                <span className="text-sm font-mono text-white/50">{shortAddr}</span>
                {isMe && (
                  <span className="text-[9px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full tracking-wider uppercase">
                    You
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold" style={{ color }}>
              {result.total}
            </div>
            <div className="text-[9px] font-mono text-white/25 tracking-wider">/40</div>
          </div>
        </div>

        {/* Score bars */}
        <div className="space-y-2 mb-4">
          <ScoreBar label="Investable" value={result.investability} color="#22d3ee" delay={delay + 200} />
          <ScoreBar label="Original" value={result.originality} color="#a855f7" delay={delay + 400} />
          <ScoreBar label="Buzzwords" value={result.buzzword_density} color="#fbbf24" delay={delay + 600} />
          <ScoreBar label="Humor" value={result.humor} color="#f43f5e" delay={delay + 800} />
        </div>

        {/* Roast */}
        <div className="px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.04]">
          <span className="text-xs font-mono text-white/40 italic">
            &quot;{result.roast}&quot;
          </span>
        </div>

        {/* XP earned */}
        <div className="mt-3 flex justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fbbf24]/10 rounded-full">
            <span className="text-xs font-bold text-[#fbbf24]">+{result.xp_earned} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Results({ result, onPlayAgain, onLeaderboard, onHome }: ResultsProps) {
  const { address } = useAccount();
  const [showTitle, setShowTitle] = useState(false);
  const [showCombo, setShowCombo] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300);
    setTimeout(() => setShowCombo(true), 800);
  }, []);

  const sorted = Array.isArray(result.results)
    ? [...result.results].sort((a, b) => a.rank - b.rank)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#fbbf24]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#a855f7]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Title */}
        <div
          className={`text-center mb-10 transition-all duration-700 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="text-[10px] font-mono text-white/30 tracking-[0.6em] uppercase mb-3">
            The VCs Have Spoken
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
            <span className="shimmer-text">RESULTS</span>
          </h1>
        </div>

        {/* Combo */}
        <div
          className={`mb-10 px-6 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center transition-all duration-700 ${
            showCombo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-[9px] font-mono text-white/25 tracking-wider uppercase mb-1">
            Startup Combo
          </div>
          <div className="text-lg font-bold text-[#fbbf24]">{result.combo}</div>
        </div>

        {/* Player cards */}
        <div className="w-full space-y-4 mb-10">
          {sorted.map((r, i) => (
            <PlayerCard
              key={r.address}
              result={r}
              rank={r.rank}
              isMe={r.address.toLowerCase() === address?.toLowerCase()}
              delay={1200 + i * 500}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 bg-[#fbbf24]/10 border border-[#fbbf24]/40 hover:border-[#fbbf24] rounded-xl text-lg font-bold text-[#fbbf24] tracking-wider uppercase transition-all hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] hover:scale-[1.02] active:scale-[0.98]"
          >
            ⚡ Play Again
          </button>
          <button
            onClick={onLeaderboard}
            className="w-full py-3 bg-[#22d3ee]/5 border border-[#22d3ee]/30 hover:border-[#22d3ee] rounded-xl text-sm font-bold text-[#22d3ee] tracking-wider uppercase transition-all"
          >
            View Leaderboard
          </button>
          <button
            onClick={onHome}
            className="w-full text-center text-white/25 hover:text-white/60 text-sm font-mono tracking-widest transition-colors py-2"
          >
            ← HOME
          </button>
        </div>
      </div>
    </div>
  );
}

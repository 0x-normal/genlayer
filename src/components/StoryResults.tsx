"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import type { StoryResult, StoryJudgingResult } from "@/lib/story-genlayer";

const COLOR = "#84cc16";
const RANK_EMOJI = ["🏆","🥈","🥉","💀","💀","💀"];
const RANK_COLORS = ["#fbbf24","#94a3b8","#cd7f32","#6b7280","#6b7280","#6b7280"];

function Bar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-white/30 w-28 text-right uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: v ? `${value * 10}%` : "0%", backgroundColor: color, boxShadow: `0 0 10px ${color}40` }} />
      </div>
      <span className="text-sm font-bold font-mono tabular-nums w-8 text-right transition-all duration-500" style={{ color, opacity: v ? 1 : 0 }}>{value}</span>
    </div>
  );
}

function Card({ r, rank, isMe, delay }: { r: StoryResult; rank: number; isMe: boolean; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  const color = RANK_COLORS[rank - 1] || "#6b7280";
  return (
    <div className={`w-full max-w-lg transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className={`relative px-6 py-5 rounded-xl border ${isMe ? "border-[#84cc16]/30 bg-[#84cc16]/[0.04]" : "bg-white/[0.02] border-white/[0.06]"}`} style={rank === 1 ? { boxShadow: `0 0 40px ${color}15` } : {}}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{RANK_EMOJI[rank - 1]}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color }}>#{rank}</span>
              <span className="text-sm font-mono text-white/50">{r.address.slice(0, 6)}...{r.address.slice(-4)}</span>
              {isMe && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full tracking-wider uppercase" style={{ color: COLOR, backgroundColor: COLOR + "15", border: `1px solid ${COLOR}40` }}>You</span>}
            </div>
          </div>
          <div className="text-right"><div className="text-2xl font-extrabold" style={{ color }}>{r.total}</div><div className="text-[9px] font-mono text-white/25">/40</div></div>
        </div>
        <div className="space-y-2 mb-4">
          <Bar label="Story" value={r.storytelling} color="#f43f5e" delay={delay + 200} />
          <Bar label="Economy" value={r.economy_of_words} color="#84cc16" delay={delay + 400} />
          <Bar label="Emotion" value={r.emotion} color="#a855f7" delay={delay + 600} />
          <Bar label="Twist" value={r.twist_quality} color="#fbbf24" delay={delay + 800} />
        </div>
        <div className="px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.04]">
          <span className="text-xs font-mono text-white/40 italic">&quot;{r.roast}&quot;</span>
        </div>
        <div className="mt-3 flex justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: COLOR + "15" }}>
            <span className="text-xs font-bold" style={{ color: COLOR }}>+{r.xp_earned} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryResults({ result, onPlayAgain, onHome }: { result: StoryJudgingResult; onPlayAgain: () => void; onHome: () => void }) {
  const { address } = useAccount();
  const [show, setShow] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 300); setTimeout(() => setShowPrompt(true), 800); }, []);
  const sorted = [...(result.results ?? [])].sort((a, b) => a.rank - b.rank);
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: COLOR + "0d" }} />
      </div>
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        <div className={`text-center mb-10 transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div className="text-[10px] font-mono text-white/30 tracking-[0.6em] uppercase mb-3">The Critics Have Reviewed</div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter"><span style={{ color: COLOR }}>STORY</span><span className="text-white"> RESULTS</span></h1>
          <div className="text-[10px] font-mono text-white/20 mt-2 tracking-wider">Judged by {result.engine ?? "GenLayer AI"}</div>
        </div>
        <div className={`mb-10 px-6 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center transition-all duration-700 ${showPrompt ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="text-[9px] font-mono text-white/25 tracking-wider uppercase mb-1">Prompt</div>
          <div className="text-lg font-bold" style={{ color: COLOR }}>📖 {result.prompt_combo}</div>
        </div>
        <div className="w-full space-y-4 mb-10">
          {sorted.map((r, i) => <Card key={r.address} r={r} rank={r.rank} isMe={r.address.toLowerCase() === address?.toLowerCase()} delay={1200 + i * 500} />)}
        </div>
        <div className="w-full space-y-3">
          <button onClick={onPlayAgain} className="w-full py-4 rounded-xl text-lg font-bold tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98] border" style={{ color: COLOR, borderColor: COLOR + "60", backgroundColor: COLOR + "15" }}>📖 Play Again</button>
          <button onClick={onHome} className="w-full text-center text-white/25 hover:text-white/60 text-sm font-mono tracking-widest transition-colors py-2">← HOME</button>
        </div>
      </div>
    </div>
  );
}

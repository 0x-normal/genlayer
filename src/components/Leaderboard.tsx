"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getLeaderboard as getPitchLeaderboard, type LeaderboardEntry } from "@/lib/genlayer";
import { getLeaderboard as getJokeLeaderboard } from "@/lib/joke-genlayer";
import { getLeaderboard as getExcuseLeaderboard } from "@/lib/excuse-genlayer";
import { getLeaderboard as getPredictionLeaderboard } from "@/lib/prediction-genlayer";
import { getLeaderboard as getStoryLeaderboard } from "@/lib/story-genlayer";

interface LeaderboardProps {
  onBack: () => void;
}

type Tab = "TOTAL" | "PITCH_WARS" | "JOKE_WARS" | "EXCUSE_WARS" | "PREDICTION_WARS" | "STORY_WARS";

const TABS: { id: Tab; label: string; emoji: string; color: string }[] = [
  { id: "TOTAL",          label: "Total",      emoji: "🌍", color: "#fbbf24" },
  { id: "PITCH_WARS",     label: "Pitch",      emoji: "⚡", color: "#fbbf24" },
  { id: "JOKE_WARS",      label: "Joke",       emoji: "😂", color: "#f43f5e" },
  { id: "EXCUSE_WARS",    label: "Excuse",     emoji: "⚖️", color: "#a855f7" },
  { id: "PREDICTION_WARS",label: "Prediction", emoji: "🔮", color: "#22d3ee" },
  { id: "STORY_WARS",     label: "Story",      emoji: "📖", color: "#84cc16" },
];

const RANK_STYLES: Record<number, { emoji: string; color: string; glow: string }> = {
  1: { emoji: "🏆", color: "#fbbf24", glow: "0 0 30px rgba(251,191,36,0.2)" },
  2: { emoji: "🥈", color: "#94a3b8", glow: "0 0 20px rgba(148,163,184,0.15)" },
  3: { emoji: "🥉", color: "#cd7f32", glow: "0 0 20px rgba(205,127,50,0.15)" },
};

// Merge multiple leaderboard arrays into one combined total
function mergeLeaderboards(boards: LeaderboardEntry[][]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  for (const board of boards) {
    for (const entry of board) {
      const key = entry.address.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.xp += entry.xp;
        existing.games += entry.games;
      } else {
        map.set(key, { ...entry, address: entry.address.toLowerCase() });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.xp - a.xp);
}

interface GameData {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("TOTAL");

  const [data, setData] = useState<Record<Tab, GameData>>({
    TOTAL:          { entries: [], loading: true, error: "" },
    PITCH_WARS:     { entries: [], loading: true, error: "" },
    JOKE_WARS:      { entries: [], loading: true, error: "" },
    EXCUSE_WARS:    { entries: [], loading: true, error: "" },
    PREDICTION_WARS:{ entries: [], loading: true, error: "" },
    STORY_WARS:     { entries: [], loading: true, error: "" },
  });

  useEffect(() => {
    const fetchers: [Tab, () => Promise<LeaderboardEntry[]>][] = [
      ["PITCH_WARS",      getPitchLeaderboard],
      ["JOKE_WARS",       getJokeLeaderboard],
      ["EXCUSE_WARS",     getExcuseLeaderboard],
      ["PREDICTION_WARS", getPredictionLeaderboard],
      ["STORY_WARS",      getStoryLeaderboard],
    ];

    const results: Partial<Record<Tab, LeaderboardEntry[]>> = {};

    const promises = fetchers.map(async ([tab, fn]) => {
      try {
        const entries = await fn();
        results[tab] = entries;
        setData((prev) => ({ ...prev, [tab]: { entries, loading: false, error: "" } }));
      } catch (err) {
        console.warn(`[Leaderboard] ${tab} failed:`, err);
        results[tab] = [];
        setData((prev) => ({
          ...prev,
          [tab]: { entries: [], loading: false, error: "Contract not deployed yet" },
        }));
      }
    });

    // After all settle, compute TOTAL
    Promise.allSettled(promises).then(() => {
      const allBoards = fetchers.map(([tab]) => results[tab] ?? []);
      const merged = mergeLeaderboards(allBoards);
      setData((prev) => ({ ...prev, TOTAL: { entries: merged, loading: false, error: "" } }));
    });
  }, []);

  const activeTab_ = TABS.find((t) => t.id === activeTab)!;
  const current = data[activeTab];
  const accentColor = activeTab_.color;

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-500"
          style={{ backgroundColor: accentColor + "0d" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono text-white/30 tracking-[0.6em] uppercase mb-3">
            Global Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
            <span className="text-white">LEADER</span>
            <span style={{ color: accentColor }}>BOARD</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 flex-wrap justify-center">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabData = data[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-200 border"
                style={{
                  color: isActive ? tab.color : "rgba(255,255,255,0.3)",
                  borderColor: isActive ? tab.color + "60" : "rgba(255,255,255,0.06)",
                  backgroundColor: isActive ? tab.color + "15" : "transparent",
                  boxShadow: isActive ? `0 0 20px ${tab.color}20` : "none",
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {!tabData.loading && tabData.entries.length > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: tab.color + "25", color: tab.color }}
                  >
                    {tabData.entries.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab label */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">{activeTab_.emoji}</span>
          <span className="text-sm font-mono font-bold tracking-wider" style={{ color: accentColor }}>
            {activeTab === "TOTAL" ? "All Games Combined" : activeTab_.label + " Wars"}
          </span>
          {activeTab === "TOTAL" && (
            <span className="text-[9px] font-mono text-white/25 tracking-wider">
              · XP summed across all contracts
            </span>
          )}
        </div>

        {/* Loading */}
        {current.loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div
              className="w-8 h-8 border-2 border-transparent rounded-full animate-spin"
              style={{ borderTopColor: accentColor }}
            />
            <span className="text-xs font-mono text-white/30 tracking-wider">
              Reading from GenLayer...
            </span>
          </div>
        )}

        {/* Error */}
        {!current.loading && current.error && (
          <div className="text-center py-8 px-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="text-2xl mb-3">🚧</div>
            <div className="text-sm font-mono text-white/40 mb-2">Contract not deployed yet</div>
            <div className="text-[10px] font-mono text-white/20">
              Deploy the contract and update the address in src/lib/
              {activeTab.toLowerCase().replace("_", "-")}.ts
            </div>
          </div>
        )}

        {/* Empty */}
        {!current.loading && !current.error && current.entries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏜️</div>
            <div className="text-sm font-mono text-white/30">
              No games played yet. Be the first!
            </div>
          </div>
        )}

        {/* Entries */}
        {!current.loading && current.entries.length > 0 && (
          <div className="space-y-2">
            {current.entries.map((entry, i) => {
              const rank = i + 1;
              const style = RANK_STYLES[rank];
              const isMe = entry.address.toLowerCase() === address?.toLowerCase();
              const shortAddr = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;

              return (
                <div
                  key={entry.address}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all`}
                  style={{
                    backgroundColor: isMe ? accentColor + "08" : "rgba(255,255,255,0.02)",
                    borderColor: isMe ? accentColor + "30" : "rgba(255,255,255,0.05)",
                    boxShadow: style?.glow || "none",
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {style ? (
                      <span className="text-xl">{style.emoji}</span>
                    ) : (
                      <span className="text-sm font-bold font-mono text-white/30">{rank}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono text-white/60">{shortAddr}</span>
                    {isMe && (
                      <span
                        className="ml-2 text-[9px] font-mono px-2 py-0.5 rounded-full tracking-wider uppercase"
                        style={{ color: accentColor, backgroundColor: accentColor + "15", border: `1px solid ${accentColor}40` }}
                      >
                        You
                      </span>
                    )}
                  </div>

                  {/* Games */}
                  <div className="text-right mr-3 shrink-0">
                    <span className="text-xs font-mono text-white/20">
                      {entry.games || 0}g
                    </span>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0 min-w-[64px]">
                    <span
                      className="text-lg font-extrabold font-mono tabular-nums"
                      style={{ color: style?.color || "#6b7280" }}
                    >
                      {entry.xp.toLocaleString()}
                    </span>
                    <div className="text-[9px] font-mono text-white/20">XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back */}
        <button
          onClick={onBack}
          className="mt-10 w-full text-center text-white/25 hover:text-white/60 text-sm font-mono tracking-widest transition-colors"
        >
          ← BACK TO MENU
        </button>
      </div>
    </div>
  );
}

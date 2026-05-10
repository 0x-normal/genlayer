"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import NetworkSwitcher from "./NetworkSwitcher";

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaderboard: () => void;
}

const GAMES = [
  {
    emoji: "⚡",
    name: "Pitch Wars",
    color: "#fbbf24",
    tagline: "Sell the unsellable",
    how: "Everyone gets the same absurd startup combo. Write your best VC pitch before the timer runs out. GenLayer AI judges Investability, Originality, Buzzword Density, and Humor across all rounds.",
  },
  {
    emoji: "😂",
    name: "Joke Wars",
    color: "#f43f5e",
    tagline: "Make the chain laugh",
    how: "Everyone gets the same joke category. Write your best joke before the timer runs out. AI comedy judges score Funniness, Originality, Timing, and Groan-worthiness across all rounds.",
  },
  {
    emoji: "⚖️",
    name: "Excuse Wars",
    color: "#a855f7",
    tagline: "Get away with anything",
    how: "Everyone is accused of the same crime. Write the most convincing excuse. AI judges score Believability, Creativity, Desperation, and Legal Viability.",
  },
  {
    emoji: "🔮",
    name: "Prediction Wars",
    color: "#22d3ee",
    tagline: "See the future on-chain",
    how: "Everyone gets the same topic. Submit your boldest prediction. Oracle AI scores Plausibility, Originality, Hype Level, and Would-Actually-Happen.",
  },
  {
    emoji: "📖",
    name: "Story Wars",
    color: "#84cc16",
    tagline: "One sentence. One story.",
    how: "Everyone gets the same Genre + Setting. Write a complete story in exactly ONE sentence. AI critics judge Storytelling, Economy of Words, Emotion, and Twist Quality.",
  },
];

const HOW_TO_PLAY = [
  { step: "1", text: "Host creates a room and shares the 6-character code" },
  { step: "2", text: "Players join with the code — up to 6 per room" },
  { step: "3", text: "Host picks the game mode, number of rounds (1–10), and duration per round (5–15 min)" },
  { step: "4", text: "Each round everyone writes their answer before the timer — all rounds collected" },
  { step: "5", text: "After all rounds, GenLayer AI judges each player's full game via Optimistic Democracy" },
  { step: "6", text: "Final scores revealed, XP awarded on-chain, global leaderboard updated" },
];

const BUTTONS = [
  { label: "Create Room", sub: "Host · Pick mode · Share code", color: "#fbbf24", onClick: "onCreateRoom" as const },
  { label: "Join Room", sub: "Enter 6-character code", color: "#a855f7", onClick: "onJoinRoom" as const },
  { label: "Leaderboard", sub: "Global XP rankings", color: "#22d3ee", onClick: "onLeaderboard" as const },
];

export default function MainMenu({ onCreateRoom, onJoinRoom, onLeaderboard }: MainMenuProps) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => setMounted(true), []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const toggleTheme = () => setTheme((t) => t === "dark" ? "light" : "dark");

  const handlers = { onCreateRoom, onJoinRoom, onLeaderboard };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden"
      style={{ backgroundColor: "var(--pw-bg)", color: "var(--pw-text)" }}>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#fbbf24]/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#a855f7]/4 rounded-full blur-[120px]" />
        <div className="absolute top-3/4 left-1/2 w-[400px] h-[400px] bg-[#22d3ee]/3 rounded-full blur-[100px]" />
      </div>

      {/* Theme toggle + Wallet + Network */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        {mounted && <NetworkSwitcher />}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ borderColor: "var(--pw-card-border)", backgroundColor: "var(--pw-card-bg)", color: "var(--pw-text-muted)" }}
        >
          <span className="text-base">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className="text-[10px] font-mono tracking-wider uppercase hidden sm:block">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>
        {mounted && <ConnectButton chainStatus="none" />}
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6 pt-24 pb-24 flex flex-col items-center">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-[10px] font-mono tracking-[0.6em] text-[#fbbf24]/60 uppercase mb-4">
            GenLayer Bradbury Testnet
          </div>
          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter leading-none mb-4">
            <span style={{ color: "var(--pw-text)" }}>WARS</span>
            <span className="shimmer-text">ARENA</span>
          </h1>
          <p className="text-sm font-mono tracking-wider max-w-md mx-auto" style={{ color: "var(--pw-text-subtle)" }}>
            5 multiplayer games · AI judges on-chain · Earn XP · Climb the leaderboard
          </p>
          <div className="mt-6 w-32 h-px bg-gradient-to-r from-transparent via-[#fbbf24]/40 to-transparent mx-auto" />
        </div>

        {/* CTA buttons */}
        <div className="w-full mb-14">
          {mounted && isConnected ? (
            <div className="flex flex-row gap-3">
              {BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={handlers[btn.onClick]}
                  className="group relative flex-1 py-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    borderColor: btn.color + "50",
                    backgroundColor: btn.color + "0d",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.borderColor = btn.color;
                    (e.currentTarget).style.boxShadow = `0 0 30px ${btn.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.borderColor = btn.color + "50";
                    (e.currentTarget).style.boxShadow = "none";
                  }}
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: btn.color + "80" }} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-xl" style={{ borderColor: btn.color + "80" }} />
                  <span className="text-sm font-bold tracking-wider uppercase block transition-colors"
                    style={{ color: "var(--pw-text)" }}>
                    {btn.label}
                  </span>
                  <div className="text-[9px] font-mono mt-1 tracking-wider" style={{ color: "var(--pw-text-subtle)" }}>
                    {btn.sub}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-5 px-6 rounded-xl border"
              style={{ backgroundColor: "var(--pw-card-bg)", borderColor: "var(--pw-card-border)" }}>
              <div className="text-sm font-mono tracking-wider text-center" style={{ color: "var(--pw-text-muted)" }}>
                Connect your wallet to start playing
              </div>
              <div className="flex justify-center">
                {mounted && <ConnectButton chainStatus="none" />}
              </div>
            </div>
          )}
        </div>

        {/* Game modes */}
        <div className="w-full mb-14">
          <div className="text-[10px] font-mono tracking-[0.5em] uppercase text-center mb-6" style={{ color: "var(--pw-label)" }}>
            Game Modes · Hover to learn more
          </div>
          <div className="flex flex-col gap-2">
            {GAMES.map((game) => {
              const isHovered = hoveredGame === game.name;
              return (
                <div
                  key={game.name}
                  className="relative px-5 py-4 rounded-xl transition-all duration-300 cursor-default overflow-hidden border"
                  style={{
                    borderColor: isHovered ? game.color + "55" : "var(--pw-card-border)",
                    boxShadow: isHovered ? `0 0 30px ${game.color}15` : "none",
                    backgroundColor: isHovered ? game.color + "10" : "var(--pw-card-bg)",
                  }}
                  onMouseEnter={() => setHoveredGame(game.name)}
                  onMouseLeave={() => setHoveredGame(null)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{game.emoji}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-base font-extrabold tracking-tight" style={{ color: game.color }}>
                        {game.name}
                      </span>
                      <span className="text-[10px] font-mono tracking-wider truncate" style={{ color: "var(--pw-label)" }}>
                        — {game.tagline}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono tracking-wider transition-all duration-300 shrink-0"
                      style={{ color: game.color, opacity: isHovered ? 0 : 0.6 }}>
                      hover ↓
                    </span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isHovered ? "120px" : "0px", opacity: isHovered ? 1 : 0 }}
                  >
                    <p className="text-xs font-mono leading-relaxed mt-3 pl-9 border-l-2 ml-1"
                      style={{ borderColor: game.color + "50", color: "var(--pw-text-muted)" }}>
                      {game.how}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* More games coming */}
        <div className="w-full flex items-center justify-center gap-3 mb-14">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--pw-divider)" }} />
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase whitespace-nowrap" style={{ color: "var(--pw-label)" }}>
            More games coming soon
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--pw-divider)" }} />
        </div>

        {/* How to play */}
        <div className="w-full mb-14">
          <div className="text-[10px] font-mono tracking-[0.5em] uppercase text-center mb-6" style={{ color: "var(--pw-label)" }}>
            How To Play
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {HOW_TO_PLAY.map((item) => (
              <div key={item.step} className="flex items-start gap-3 px-4 py-3 rounded-lg border"
                style={{ backgroundColor: "var(--pw-step-bg)", borderColor: "var(--pw-step-border)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.5)" }}>
                  <span className="text-[9px] font-bold font-mono text-[#fbbf24]">{item.step}</span>
                </div>
                <span className="text-xs font-mono leading-relaxed" style={{ color: "var(--pw-step-text)" }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="text-[10px] font-mono tracking-wider" style={{ color: "var(--pw-label)" }}>
            Powered by GenLayer Intelligent Contracts · Optimistic Democracy Consensus
          </div>
        </div>

      </div>
    </div>
  );
}
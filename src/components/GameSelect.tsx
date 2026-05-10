"use client";

export type GameMode = "PITCH_WARS" | "JOKE_WARS" | "EXCUSE_WARS" | "PREDICTION_WARS" | "STORY_WARS";

interface GameSelectProps {
  intent: "CREATE";
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

const GAMES: { mode: GameMode; emoji: string; title: string; subtitle: string; description: string; color: string }[] = [
  { mode: "PITCH_WARS", emoji: "⚡", title: "PITCH", subtitle: "WARS", description: "Pitch absurd startups to ruthless VC AI validators. Earn XP on-chain.", color: "#fbbf24" },
  { mode: "JOKE_WARS", emoji: "😂", title: "JOKE", subtitle: "WARS", description: "Tell the funniest joke in a random category. AI comedy judges decide the winner.", color: "#f43f5e" },
  { mode: "EXCUSE_WARS", emoji: "⚖️", title: "EXCUSE", subtitle: "WARS", description: "Everyone gets the same crime. Write the best excuse to get away with it.", color: "#a855f7" },
  { mode: "PREDICTION_WARS", emoji: "🔮", title: "PREDICTION", subtitle: "WARS", description: "Submit your wildest prediction on a topic. AI oracles judge boldness and originality.", color: "#22d3ee" },
  { mode: "STORY_WARS", emoji: "📖", title: "STORY", subtitle: "WARS", description: "Write a complete story in ONE sentence. Genre + setting assigned. Craft counts.", color: "#84cc16" },
];

export default function GameSelect({ intent, onSelect, onBack }: GameSelectProps) {
  const actionLabel = "Create Room →";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#fbbf24]/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#a855f7]/4 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="text-[10px] font-mono tracking-[0.6em] text-white/30 uppercase mb-3">Select Game Mode</div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-white">WHAT ARE WE<span className="text-white/20"> _</span></h1>
          <h1 className="text-5xl font-extrabold tracking-tighter text-white">PLAYING<span className="text-[#fbbf24]">?</span></h1>
          <div className="mt-4 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto" />
        </div>

        <div className="flex flex-col gap-3">
          {GAMES.map((game) => (
            <button key={game.mode} onClick={() => onSelect(game.mode)}
              className="group relative w-full text-left px-6 py-4 bg-white/[0.02] rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-white/[0.04] border border-white/[0.06]"
              style={{ ["--hover-border" as string]: game.color }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = game.color + "60"; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${game.color}12`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: game.color + "50" }} />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: game.color + "50" }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{game.emoji}</span>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold tracking-tighter text-white">{game.title}</span>
                      <span className="text-xl font-extrabold tracking-tighter" style={{ color: game.color }}>{game.subtitle}</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/35 mt-0.5 max-w-xs leading-relaxed">{game.description}</p>
                  </div>
                </div>
                <span className="text-sm font-mono ml-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: game.color }}>{actionLabel}</span>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onBack} className="mt-8 w-full text-center text-white/25 hover:text-white/60 text-sm font-mono tracking-widest transition-colors">← BACK</button>
      </div>
    </div>
  );
}
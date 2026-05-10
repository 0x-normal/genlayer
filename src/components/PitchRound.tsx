"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { NetworkService, PlayerInfo, PitchMessage } from "@/lib/network";
import { generateCombo } from "@/data/combos";
import { submitEntry, type PitchRoundMeta } from "@/lib/genlayer";

const MAX_CHARS = 400;
const COLOR = "#fbbf24";

interface Props {
  network: NetworkService;
  players: PlayerInfo[];
  isHost: boolean;
  duration: number;
  totalRounds: number;
  gameId: string;
  onAllSubmitted: (roundsMeta: PitchRoundMeta[], allAddresses: string[]) => void;
}

export default function PitchRound({ network, players, isHost, duration, totalRounds, gameId, onAllSubmitted }: Props) {
  const { address } = useAccount();

  const [currentRound, setCurrentRound] = useState(1);
  const [combo, setCombo] = useState("");
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());

  const allRoundsRef = useRef<PitchRoundMeta[]>([]);
  const submittedRef = useRef<Set<string>>(new Set());
  const hasAdvancedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = useCallback((roundNum: number) => {
    setCurrentRound(roundNum);
    setText("");
    setSubmitted(false);
    setSubmittedPlayers(new Set());
    setTimeLeft(duration);
    submittedRef.current = new Set();
    hasAdvancedRef.current = false;
    if (isHost) {
      const c = generateCombo();
      setCombo(c);
      network.broadcast({ type: "COMBO_ASSIGN", payload: { combo: c } });
    }
  }, [isHost, duration, network]);

  useEffect(() => { startRound(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); if (!submitted && address) doSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = useCallback((msg: PitchMessage) => {
    if (msg.type === "COMBO_ASSIGN") { setCombo((msg.payload as { combo: string }).combo); return; }
    if (msg.type === "PITCH_SUBMIT") {
      const d = msg.payload as { address: string };
      submittedRef.current = new Set([...submittedRef.current, d.address]);
      setSubmittedPlayers(new Set(submittedRef.current));
    }
    if (msg.type === "ROUND_ADVANCE") {
      const data = msg.payload as { round: number; combo: string };
      setCombo(data.combo);
      startRound(data.round);
    }
    if (msg.type === "ALL_PITCHES" && !hasAdvancedRef.current) {
      hasAdvancedRef.current = true;
      const data = msg.payload as { roundsMeta: PitchRoundMeta[]; allAddresses: string[] };
      onAllSubmitted(data.roundsMeta, data.allAddresses);
    }
  }, [onAllSubmitted, startRound]);

  useEffect(() => { network.onMessage(handleMessage); }, [network, handleMessage]);

  const doSubmit = (auto = false) => {
    if (submitted || !address) return;
    setSubmitted(true);
    const finalText = text.trim() || (auto ? "(no pitch submitted)" : "");
    if (!finalText) return;

    submitEntry(address, gameId, currentRound, finalText).catch((e) => {
      console.error("[PitchRound] submitEntry failed:", e);
    });

    network.broadcast({ type: "PITCH_SUBMIT", payload: { address } });
    submittedRef.current = new Set([...submittedRef.current, address]);
    setSubmittedPlayers(new Set(submittedRef.current));
  };

  useEffect(() => {
    if (!isHost || hasAdvancedRef.current) return;
    const allIn = players.every((p) => submittedRef.current.has(p.address));
    if (!allIn) return;

    hasAdvancedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const roundData: PitchRoundMeta = { round: currentRound, combo };
    const updatedRounds = [...allRoundsRef.current, roundData];
    allRoundsRef.current = updatedRounds;

    if (currentRound < totalRounds) {
      const nextRound = currentRound + 1;
      const nextCombo = generateCombo();
      network.broadcast({ type: "ROUND_ADVANCE", payload: { round: nextRound, combo: nextCombo } });
      setCombo(nextCombo);
      startRound(nextRound);
    } else {
      const allAddresses = players.map((p) => p.address);
      network.broadcast({ type: "ALL_PITCHES", payload: { roundsMeta: updatedRounds, allAddresses } });
      onAllSubmitted(updatedRounds, allAddresses);
    }
  }, [submittedPlayers]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = (timeLeft / duration) * 100;
  const timerColor = timeLeft > duration * 0.5 ? "#84cc16" : timeLeft > duration * 0.2 ? "#fbbf24" : "#f43f5e";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ backgroundColor: COLOR + "0d" }} />
      </div>
      <div className="relative z-10 w-full max-w-2xl">
        {totalRounds > 1 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === currentRound ? "32px" : "12px",
                  backgroundColor: i + 1 < currentRound ? "#84cc16" : i + 1 === currentRound ? COLOR : "rgba(255,255,255,0.1)",
                }} />
            ))}
            <span className="text-[10px] font-mono text-white/30 tracking-wider ml-2">
              Round {currentRound}/{totalRounds}
            </span>
          </div>
        )}
        <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%`, backgroundColor: timerColor }} />
        </div>
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-1">Startup Combo</div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {combo ? <><span style={{ color: COLOR }}>{"⚡ "}</span><span className="text-white">{combo}</span></> : <span className="text-white/20 animate-pulse">Generating combo...</span>}
            </h2>
            <p className="text-xs font-mono text-white/25 mt-1">Pitch this absurd startup to ruthless VC AI</p>
          </div>
          <div className="flex flex-col items-center px-5 py-3 border rounded-xl bg-white/[0.02]" style={{ borderColor: timerColor + "50" }}>
            <span className="text-3xl font-extrabold font-mono tabular-nums" style={{ color: timerColor }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] font-mono text-white/25 tracking-wider uppercase">remaining</span>
          </div>
        </div>
        {!submitted ? (
          <div className="mb-6">
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={`Combo: "${combo}"\n\nPitch your absurd startup. Synergy, scale, web3 — go wild.\n\nRound ${currentRound}/${totalRounds} · ${Math.round(duration / 60)} min on the clock.`}
              className="pitch-textarea h-44" autoFocus disabled={timeLeft === 0}
              onFocus={(e) => { e.target.style.borderColor = COLOR; e.target.style.boxShadow = `0 0 30px ${COLOR}33`; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[10px] font-mono text-white/20">{text.length}/{MAX_CHARS}</span>
              <button onClick={() => doSubmit(false)} disabled={!text.trim()}
                className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 border"
                style={{ color: COLOR, borderColor: COLOR + "60", backgroundColor: COLOR + "15" }}>
                Pitch It ⚡
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 px-6 py-8 bg-white/[0.02] border border-[#84cc16]/20 rounded-xl text-center">
            <div className="text-[#84cc16] text-lg font-bold mb-2">✓ Pitch Submitted</div>
            <div className="text-xs font-mono text-white/30 tracking-wider">
              {currentRound < totalRounds ? `Waiting for others... Round ${currentRound + 1} coming up.` : "Waiting for other founders..."}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map((p) => {
            const done = submittedPlayers.has(p.address);
            return (
              <div key={p.address} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all ${done ? "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]" : "border-white/10 bg-white/[0.02] text-white/30"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${done ? "bg-[#84cc16]" : "bg-white/20 animate-pulse"}`} />
                {p.name}{done && " ⚡"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

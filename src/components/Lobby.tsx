"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { NetworkService, PlayerInfo, PitchMessage } from "@/lib/network";
import type { GameMode } from "@/components/GameSelect";

interface LobbyProps {
  mode: "CREATE" | "JOIN";
  gameMode: GameMode;
  onGameStart: (network: NetworkService, players: PlayerInfo[], isHost: boolean, gameMode: GameMode, duration: number, rounds: number, gameId: string) => void;
  onBack: () => void;
}

const GAME_NAMES: Record<GameMode, string> = {
  PITCH_WARS: "Pitch Wars ⚡",
  JOKE_WARS: "Joke Wars 😂",
  EXCUSE_WARS: "Excuse Wars ⚖️",
  PREDICTION_WARS: "Prediction Wars 🔮",
  STORY_WARS: "Story Wars 📖",
};

const GAME_COLORS: Record<GameMode, string> = {
  PITCH_WARS: "#fbbf24",
  JOKE_WARS: "#f43f5e",
  EXCUSE_WARS: "#a855f7",
  PREDICTION_WARS: "#22d3ee",
  STORY_WARS: "#84cc16",
};

const DEFAULT_DURATION = 300;  // 5 minutes in seconds
const MIN_DURATION = 300;      // 5 min
const MAX_DURATION = 900;      // 15 min
const STEP = 60;               // 1 minute steps

export default function Lobby({ mode, gameMode, onGameStart, onBack }: LobbyProps) {
  const { address } = useAccount();
  const [phase, setPhase] = useState<"INIT" | "WAITING" | "INPUT" | "CONNECTING">("INIT");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [rounds, setRounds] = useState(1);
  const networkRef = useRef<NetworkService | null>(null);
  const gameStartedRef = useRef(false);
  const playersRef = useRef<PlayerInfo[]>([]);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => {
    return () => { if (!gameStartedRef.current) networkRef.current?.destroy(); };
  }, []);

  const handleMessage = useCallback((msg: PitchMessage) => {
    switch (msg.type) {
      case "PLAYER_JOIN": {
        const player = msg.payload as PlayerInfo;
        setPlayers((prev) => {
          if (prev.find((p) => p.address === player.address)) return prev;
          const updated = [...prev, player];
          if (networkRef.current?.isHosting) {
            setTimeout(() => {
              networkRef.current?.broadcast({ type: "PLAYER_LIST", payload: updated });
            }, 100);
          }
          return updated;
        });
        break;
      }
      case "PLAYER_LIST":
        setPlayers(msg.payload as PlayerInfo[]);
        break;
      case "GAME_START": {
        const data = msg.payload as { players: PlayerInfo[]; gameMode: GameMode; duration: number; rounds: number; gameId: string };
        gameStartedRef.current = true;
        onGameStart(networkRef.current!, data.players, false, data.gameMode, data.duration, data.rounds, data.gameId);
        break;
      }
    }
  }, [onGameStart]);

  const createRoom = async () => {
    if (!address) return;
    setPhase("WAITING"); setStatus("Creating room..."); setError("");
    const net = new NetworkService();
    networkRef.current = net;
    net.onMessage(handleMessage);
    net.onConnected(() => { setStatus(`${playersRef.current.length + 1} player(s) in room`); });
    net.onDisconnected((peerId) => { setPlayers((prev) => prev.filter((p) => p.peerId !== peerId)); });
    try {
      const code = await net.createRoom();
      setRoomCode(code);
      const me: PlayerInfo = { address, peerId: net.myPeerId, name: `${address.slice(0, 6)}...${address.slice(-4)}` };
      setPlayers([me]);
      setStatus("Waiting for players...");
    } catch (err) {
      setError(`Failed to create room: ${err}`); setPhase("INIT");
    }
  };

  const joinRoom = async (codeOverride?: string) => {
    if (!address) return;
    const code = (codeOverride ?? inputCode).trim().toUpperCase();
    if (!code || code.length !== 6) { setError("Enter a valid 6-character room code"); return; }
    setPhase("CONNECTING"); setStatus("Connecting to room..."); setError("");
    const net = new NetworkService();
    networkRef.current = net;
    net.onMessage(handleMessage);
    net.onDisconnected(() => { setStatus("Connection lost."); });
    try {
      await net.joinRoom(code);
      setRoomCode(code);
      const me: PlayerInfo = { address, peerId: net.myPeerId, name: `${address.slice(0, 6)}...${address.slice(-4)}` };
      net.broadcast({ type: "PLAYER_JOIN", payload: me });
      setPlayers([me]);
      setPhase("WAITING");
      setStatus("Connected! Waiting for host to start...");
    } catch (err) {
      setError(`Failed to join: ${err}`); setPhase("INIT");
    }
  };

  const startGame = () => {
    if (!networkRef.current || players.length < 2) return;
    // Generate a fresh on-chain game id so every entry submission is scoped
    // to *this* match. Hex-encoded random bytes keep it short & opaque.
    const gameId = (() => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    })();
    gameStartedRef.current = true;
    networkRef.current.broadcast({
      type: "GAME_START",
      payload: { players: playersRef.current, gameMode, duration, rounds, gameId },
    });
    onGameStart(networkRef.current, playersRef.current, true, gameMode, duration, rounds, gameId);
  };

  const copyCode = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(roomCode);
    } else {
      const ta = document.createElement("textarea");
      ta.value = roomCode; ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (mode === "CREATE" && phase === "INIT") createRoom();
    if (mode === "JOIN" && phase === "INIT") setPhase("INPUT");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHost = networkRef.current?.isHosting ?? false;
  const accentColor = GAME_COLORS[gameMode];
  const gameName = GAME_NAMES[gameMode];
  const durationMins = Math.round(duration / 60);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: accentColor + "08" }} />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-[#a855f7]/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4"
            style={{ borderColor: accentColor + "40", backgroundColor: accentColor + "10" }}>
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: accentColor }}>{gameName}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tighter">
            {mode === "CREATE" ? (
              <><span className="text-white">HOST</span><span style={{ color: accentColor }}>_ROOM</span></>
            ) : (
              <><span className="text-white">JOIN</span><span style={{ color: accentColor }}>_ROOM</span></>
            )}
          </h2>
        </div>

        {/* Join input */}
        {phase === "INPUT" && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-sm text-white/40 font-mono tracking-wider">Enter the 6-character room code</div>
            <input
              type="text" value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123" maxLength={6}
              className="w-full max-w-xs text-center text-3xl font-bold tracking-[0.5em] font-mono bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none transition-all uppercase"
              onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 30px ${accentColor}33`; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              autoFocus
            />
            <button onClick={() => joinRoom()} disabled={inputCode.length !== 6}
              className="w-full max-w-xs py-3 rounded-xl text-white font-bold tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed border"
              style={{ borderColor: accentColor + "60", backgroundColor: accentColor + "15" }}>
              Connect
            </button>
          </div>
        )}

        {/* Room code (host) */}
        {phase === "WAITING" && roomCode && isHost && (
          <div className="mb-8">
            <div className="text-[10px] text-white/30 font-mono tracking-[0.4em] uppercase text-center mb-3">Share this code</div>
            <div onClick={copyCode}
              className="w-full py-5 bg-white/[0.03] rounded-xl text-center cursor-pointer hover:bg-white/[0.06] transition-all group border"
              style={{ borderColor: accentColor + "40" }}>
              <span className="text-4xl font-extrabold tracking-[0.6em] font-mono" style={{ color: accentColor }}>{roomCode}</span>
              <div className="text-[9px] text-white/25 font-mono mt-2 tracking-wider">{copied ? "✓ COPIED" : "CLICK TO COPY"}</div>
            </div>
          </div>
        )}

        {/* Room code (joiner) */}
        {phase === "WAITING" && roomCode && !isHost && (
          <div className="mb-8 text-center">
            <div className="text-[10px] text-white/30 font-mono tracking-[0.4em] uppercase mb-2">Room</div>
            <span className="text-2xl font-bold tracking-[0.4em] font-mono" style={{ color: accentColor }}>{roomCode}</span>
          </div>
        )}

        {/* Player list */}
        {(phase === "WAITING" || phase === "CONNECTING") && players.length > 0 && (
          <div className="mb-8">
            <div className="text-[10px] text-white/30 font-mono tracking-[0.4em] uppercase mb-4 text-center">Players ({players.length}/6)</div>
            <div className="space-y-2">
              {players.map((p, i) => (
                <div key={p.address} className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                    style={{ background: `linear-gradient(135deg, ${accentColor}30, #a855f730)` }}>{i + 1}</div>
                  <span className="text-sm font-mono text-white/70 flex-1">{p.name}</span>
                  {i === 0 && isHost && (
                    <span className="text-[9px] font-mono tracking-wider uppercase" style={{ color: accentColor + "99" }}>Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Rounds picker — host only */}
        {phase === "WAITING" && isHost && (
          <div className="mb-4 px-5 py-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase">Rounds</span>
              <span className="text-sm font-bold font-mono" style={{ color: accentColor }}>
                {rounds} round{rounds > 1 ? "s" : ""}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((rounds - 1) / 9) * 100}%, rgba(255,255,255,0.1) ${((rounds - 1) / 9) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-mono text-white/20">1 round</span>
              <span className="text-[9px] font-mono text-white/20">10 rounds</span>
            </div>
          </div>
        )}

        {/* Duration picker — host only, shown when waiting with ≥1 player */}
        {phase === "WAITING" && isHost && (
          <div className="mb-6 px-5 py-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase">Round Duration</span>
              <span className="text-sm font-bold font-mono" style={{ color: accentColor }}>
                {durationMins} min{durationMins !== 1 ? "s" : ""}
              </span>
            </div>
            <input
              type="range"
              min={MIN_DURATION}
              max={MAX_DURATION}
              step={STEP}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100}%, rgba(255,255,255,0.1) ${((duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION)) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-mono text-white/20">5 min</span>
              <span className="text-[9px] font-mono text-white/20">15 min</span>
            </div>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span className="text-xs font-mono text-white/40 tracking-wider">{status}</span>
          </div>
        )}

        {/* Start button */}
        {phase === "WAITING" && isHost && players.length >= 2 && (
          <button onClick={startGame}
            className="w-full py-4 rounded-xl text-lg font-bold tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98] border"
            style={{ color: accentColor, borderColor: accentColor + "80", background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)` }}
            onMouseEnter={(e) => { (e.currentTarget).style.boxShadow = `0 0 40px ${accentColor}25`; }}
            onMouseLeave={(e) => { (e.currentTarget).style.boxShadow = "none"; }}
          >
            ▶ Start {gameName} · {rounds} round{rounds > 1 ? 's' : ''} · {durationMins} min/round ({players.length} players)
          </button>
        )}

        {/* Waiting message for non-host */}
        {phase === "WAITING" && !isHost && (
          <div className="text-center text-xs font-mono text-white/25 tracking-wider">
            Waiting for host to start the game...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-center text-sm font-mono text-[#f43f5e] tracking-wider animate-pulse">⚠ {error}</div>
        )}

        {/* Back */}
        <button onClick={() => { networkRef.current?.destroy(); onBack(); }}
          className="mt-8 w-full text-center text-white/25 hover:text-white/60 text-sm font-mono tracking-widest transition-colors">
          ← BACK
        </button>
      </div>
    </div>
  );
}
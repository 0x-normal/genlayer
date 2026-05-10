"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { NetworkService, PlayerInfo } from "@/lib/network";
import { finalizePitches, type JudgingResult, type PitchRoundMeta } from "@/lib/genlayer";
import { finalizeJokes, type JokeJudgingResult, type JokeRoundMeta } from "@/lib/joke-genlayer";
import { finalizeExcuses, type ExcuseJudgingResult, type ExcuseRoundMeta } from "@/lib/excuse-genlayer";
import { finalizePredictions, type PredictionJudgingResult, type PredictionRoundMeta } from "@/lib/prediction-genlayer";
import { finalizeStories, type StoryJudgingResult, type StoryRoundMeta } from "@/lib/story-genlayer";
import GameSelect, { type GameMode } from "@/components/GameSelect";
import MainMenu from "@/components/MainMenu";
import Lobby from "@/components/Lobby";
import PitchRound from "@/components/PitchRound";
import JokeRound from "@/components/JokeRound";
import ExcuseRound from "@/components/ExcuseRound";
import PredictionRound from "@/components/PredictionRound";
import StoryRound from "@/components/StoryRound";
import ConsensusLoader from "@/components/ConsensusLoader";
import Results from "@/components/Results";
import JokeResults from "@/components/JokeResults";
import ExcuseResults from "@/components/ExcuseResults";
import PredictionResults from "@/components/PredictionResults";
import StoryResults from "@/components/StoryResults";
import Leaderboard from "@/components/Leaderboard";

type GameState =
  | "MENU"
  | "GAME_SELECT_CREATE"
  | "CREATE_LOBBY" | "JOIN_LOBBY"
  | "PITCHING" | "JOKING" | "EXCUSING" | "PREDICTING" | "STORYING"
  | "JUDGING"
  | "RESULTS" | "JOKE_RESULTS" | "EXCUSE_RESULTS" | "PREDICTION_RESULTS" | "STORY_RESULTS"
  | "LEADERBOARD";

const ROUND_STATE: Record<GameMode, GameState> = {
  PITCH_WARS: "PITCHING", JOKE_WARS: "JOKING",
  EXCUSE_WARS: "EXCUSING", PREDICTION_WARS: "PREDICTING", STORY_WARS: "STORYING",
};

export default function Home() {
  const { address } = useAccount();
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [gameMode, setGameMode] = useState<GameMode>("PITCH_WARS");
  const [network, setNetwork] = useState<NetworkService | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [duration, setDuration] = useState(300);
  const [totalRounds, setTotalRounds] = useState(1);
  const [gameId, setGameId] = useState<string>("");

  const [judgingResult, setJudgingResult] = useState<JudgingResult | null>(null);
  const [jokeResult, setJokeResult] = useState<JokeJudgingResult | null>(null);
  const [excuseResult, setExcuseResult] = useState<ExcuseJudgingResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionJudgingResult | null>(null);
  const [storyResult, setStoryResult] = useState<StoryJudgingResult | null>(null);
  const [judgingError, setJudgingError] = useState("");

  const handleGameSelect = (mode: GameMode) => {
    setGameMode(mode);
    setGameState("CREATE_LOBBY");
  };

  const handleGameStart = useCallback(
    (net: NetworkService, playerList: PlayerInfo[], hosting: boolean, receivedMode: GameMode, receivedDuration: number, receivedRounds: number, receivedGameId: string) => {
      setNetwork(net);
      setPlayers(playerList);
      setIsHost(hosting);
      setGameMode(receivedMode);
      setDuration(receivedDuration);
      setTotalRounds(receivedRounds);
      setGameId(receivedGameId);
      setGameState(ROUND_STATE[receivedMode]);
    },
    []
  );

  async function runJudging<T>(
    glFn: () => Promise<T>,
    onSuccess: (r: T) => void,
    net: NetworkService | null,
    gameType: string
  ) {
    try {
      console.log(`[${gameType}] Sending finalize tx...`);
      const result = await glFn();
      onSuccess(result);
    } catch (e) {
      const msg = String(e);
      console.error(`[${gameType}] GenLayer error:`, e);
      setJudgingError(msg);
      net?.broadcast({ type: "ERROR", payload: { error: msg } });
    }
  }

  // All on-chain entries are submitted by individual players. The host only
  // calls finalize_*. The round components emit just round metadata
  // (round number + topic) and the full address list.

  const handleAllPitchesSubmitted = useCallback(
    async (roundsMeta: PitchRoundMeta[], allAddresses: string[]) => {
      setGameState("JUDGING"); setJudgingError("");
      if (!isHost || !address) return;
      await runJudging(
        () => finalizePitches(address, gameId, roundsMeta, allAddresses),
        (r) => {
          setJudgingResult(r); setGameState("RESULTS");
          network?.broadcast({ type: "JUDGING_RESULT", payload: r });
        },
        network, "PitchWars"
      );
    },
    [isHost, address, network, gameId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAllJokesSubmitted = useCallback(
    async (roundsMeta: JokeRoundMeta[], allAddresses: string[]) => {
      setGameState("JUDGING");
      if (!isHost || !address) return;
      await runJudging(
        () => finalizeJokes(address, gameId, roundsMeta, allAddresses),
        (r) => {
          setJokeResult(r); setGameState("JOKE_RESULTS");
          network?.broadcast({ type: "JUDGING_RESULT", payload: { ...r, _gameType: "JOKE_WARS" } });
        },
        network, "JokeWars"
      );
    },
    [isHost, address, network, gameId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAllExcusesSubmitted = useCallback(
    async (roundsMeta: ExcuseRoundMeta[], allAddresses: string[]) => {
      setGameState("JUDGING");
      if (!isHost || !address) return;
      await runJudging(
        () => finalizeExcuses(address, gameId, roundsMeta, allAddresses),
        (r) => {
          setExcuseResult(r); setGameState("EXCUSE_RESULTS");
          network?.broadcast({ type: "JUDGING_RESULT", payload: { ...r, _gameType: "EXCUSE_WARS" } });
        },
        network, "ExcuseWars"
      );
    },
    [isHost, address, network, gameId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAllPredictionsSubmitted = useCallback(
    async (roundsMeta: PredictionRoundMeta[], allAddresses: string[]) => {
      setGameState("JUDGING");
      if (!isHost || !address) return;
      await runJudging(
        () => finalizePredictions(address, gameId, roundsMeta, allAddresses),
        (r) => {
          setPredictionResult(r); setGameState("PREDICTION_RESULTS");
          network?.broadcast({ type: "JUDGING_RESULT", payload: { ...r, _gameType: "PREDICTION_WARS" } });
        },
        network, "PredictionWars"
      );
    },
    [isHost, address, network, gameId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAllStoriesSubmitted = useCallback(
    async (roundsMeta: StoryRoundMeta[], allAddresses: string[]) => {
      setGameState("JUDGING");
      if (!isHost || !address) return;
      await runJudging(
        () => finalizeStories(address, gameId, roundsMeta, allAddresses),
        (r) => {
          setStoryResult(r); setGameState("STORY_RESULTS");
          network?.broadcast({ type: "JUDGING_RESULT", payload: { ...r, _gameType: "STORY_WARS" } });
        },
        network, "StoryWars"
      );
    },
    [isHost, address, network, gameId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const gameModeRef = useRef(gameMode);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  useEffect(() => {
    if (!network) return;
    network.onMessage((msg) => {
      if (msg.type !== "JUDGING_RESULT") return;
      const p = msg.payload as JudgingResult & { _gameType?: string };
      const gt = p._gameType ?? gameModeRef.current;
      if (gt === "JOKE_WARS") { setJokeResult(p as unknown as JokeJudgingResult); setGameState("JOKE_RESULTS"); }
      else if (gt === "EXCUSE_WARS") { setExcuseResult(p as unknown as ExcuseJudgingResult); setGameState("EXCUSE_RESULTS"); }
      else if (gt === "PREDICTION_WARS") { setPredictionResult(p as unknown as PredictionJudgingResult); setGameState("PREDICTION_RESULTS"); }
      else if (gt === "STORY_WARS") { setStoryResult(p as unknown as StoryJudgingResult); setGameState("STORY_RESULTS"); }
      else { setJudgingResult(p); setGameState("RESULTS"); }
    });
  }, [network]);

  const resetToMenu = () => {
    network?.destroy();
    setNetwork(null); setPlayers([]); setIsHost(false);
    setJudgingResult(null); setJokeResult(null); setExcuseResult(null);
    setPredictionResult(null); setStoryResult(null); setJudgingError("");
    setGameId("");
    setGameState("MENU");
  };

  return (
    <main className="relative min-h-screen">
      {gameState === "MENU" && (
        <MainMenu
          onCreateRoom={() => setGameState("GAME_SELECT_CREATE")}
          onJoinRoom={() => setGameState("JOIN_LOBBY")}
          onLeaderboard={() => setGameState("LEADERBOARD")}
        />
      )}

      {gameState === "GAME_SELECT_CREATE" && (
        <GameSelect
          intent="CREATE"
          onSelect={handleGameSelect}
          onBack={() => setGameState("MENU")}
        />
      )}

      {gameState === "CREATE_LOBBY" && (
        <Lobby
          mode="CREATE"
          gameMode={gameMode}
          onGameStart={handleGameStart}
          onBack={() => setGameState("GAME_SELECT_CREATE")}
        />
      )}

      {gameState === "JOIN_LOBBY" && (
        <Lobby
          mode="JOIN"
          gameMode={gameMode}
          onGameStart={handleGameStart}
          onBack={() => setGameState("MENU")}
        />
      )}

      {gameState === "PITCHING" && network && (
        <PitchRound network={network} players={players} isHost={isHost} duration={duration} totalRounds={totalRounds} gameId={gameId} onAllSubmitted={handleAllPitchesSubmitted} />
      )}
      {gameState === "JOKING" && network && (
        <JokeRound network={network} players={players} isHost={isHost} duration={duration} totalRounds={totalRounds} gameId={gameId} onAllSubmitted={handleAllJokesSubmitted} />
      )}
      {gameState === "EXCUSING" && network && (
        <ExcuseRound network={network} players={players} isHost={isHost} duration={duration} totalRounds={totalRounds} gameId={gameId} onAllSubmitted={handleAllExcusesSubmitted} />
      )}
      {gameState === "PREDICTING" && network && (
        <PredictionRound network={network} players={players} isHost={isHost} duration={duration} totalRounds={totalRounds} gameId={gameId} onAllSubmitted={handleAllPredictionsSubmitted} />
      )}
      {gameState === "STORYING" && network && (
        <StoryRound network={network} players={players} isHost={isHost} duration={duration} totalRounds={totalRounds} gameId={gameId} onAllSubmitted={handleAllStoriesSubmitted} />
      )}

      {gameState === "JUDGING" && (
        <div>
          <ConsensusLoader />
          {judgingError && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-md px-6 py-4 bg-[#f43f5e]/10 border border-[#f43f5e]/30 rounded-xl text-center">
              <div className="text-sm font-mono text-[#f43f5e] mb-2">⚠ Judging Error</div>
              <div className="text-xs font-mono text-white/40 mb-3">{judgingError}</div>
              <button onClick={resetToMenu} className="text-xs font-mono text-white/50 hover:text-white/80 underline">
                Return to menu
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === "RESULTS" && judgingResult && (
        <Results result={judgingResult} onPlayAgain={resetToMenu} onLeaderboard={() => setGameState("LEADERBOARD")} onHome={resetToMenu} />
      )}
      {gameState === "JOKE_RESULTS" && jokeResult && (
        <JokeResults result={jokeResult} onPlayAgain={resetToMenu} onHome={resetToMenu} />
      )}
      {gameState === "EXCUSE_RESULTS" && excuseResult && (
        <ExcuseResults result={excuseResult} onPlayAgain={resetToMenu} onHome={resetToMenu} />
      )}
      {gameState === "PREDICTION_RESULTS" && predictionResult && (
        <PredictionResults result={predictionResult} onPlayAgain={resetToMenu} onHome={resetToMenu} />
      )}
      {gameState === "STORY_RESULTS" && storyResult && (
        <StoryResults result={storyResult} onPlayAgain={resetToMenu} onHome={resetToMenu} />
      )}

      {gameState === "LEADERBOARD" && <Leaderboard onBack={resetToMenu} />}
    </main>
  );
}

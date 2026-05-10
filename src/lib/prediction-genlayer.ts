"use client";

import { createClient } from "genlayer-js";
import { getActiveChain, getContract } from "./chain";
import { extractFromReceipt, fetchFullReceipt } from "./extract-result";

const GAME = "prediction_wars" as const;
const CONTRACT = () => getContract(GAME);

const readClient = () => createClient({ chain: getActiveChain() });
function writeClient(address: string) {
  return createClient({ chain: getActiveChain(), account: address as `0x${string}` });
}

export interface PredictionResult {
  address: string;
  plausibility: number;
  originality: number;
  hype_level: number;
  would_actually_happen: number;
  total: number;
  rank: number;
  roast: string;
  xp_earned: number;
}

export interface PredictionJudgingResult {
  topic: string;
  results: PredictionResult[];
  winner: string;
  engine?: string;
}

export type PredictionRoundMeta = { round: number; topic: string };

export async function getLeaderboard(): Promise<{ address: string; xp: number; games: number }[]> {
  const raw = await readClient().readContract({ address: CONTRACT(), functionName: "get_leaderboard", args: [] });
  return JSON.parse(raw as string);
}

export async function getPlayerXp(address: string): Promise<number> {
  const result = await readClient().readContract({ address: CONTRACT(), functionName: "get_player_xp", args: [address] });
  return Number(result);
}

export async function getSubmissionCount(gameId: string): Promise<number> {
  const r = await readClient().readContract({
    address: CONTRACT(),
    functionName: "get_submission_count",
    args: [gameId],
  });
  return Number(r);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidResult(obj: any): obj is PredictionJudgingResult {
  return obj && typeof obj === "object" &&
    Array.isArray(obj.results) && obj.results.length > 0 &&
    typeof obj.results[0]?.address === "string" &&
    typeof obj.winner === "string";
}

function extractResult(tx: unknown): PredictionJudgingResult | null {
  return extractFromReceipt<PredictionJudgingResult>(tx, isValidResult);
}

export async function submitEntry(
  callerAddress: string,
  gameId: string,
  round: number,
  text: string,
): Promise<`0x${string}`> {
  const client = writeClient(callerAddress);
  const txHash = await client.writeContract({
    address: CONTRACT(),
    functionName: "submit_entry",
    args: [gameId, round, text],
    value: BigInt(0),
    leaderOnly: true,
  });
  console.log("[prediction submitEntry]", { gameId, round, txHash });
  return txHash;
}

export async function finalizePredictions(
  callerAddress: string,
  gameId: string,
  roundsMeta: PredictionRoundMeta[],
  allAddresses: string[],
): Promise<PredictionJudgingResult> {
  const currentWeek = Math.floor(Date.now() / 1000 / 604800);
  const client = writeClient(callerAddress);

  const expectedTotal = allAddresses.length * roundsMeta.length;
  const startWait = Date.now();
  let lastSeen = 0;
  while (Date.now() - startWait < 60_000) {
    const cnt = await getSubmissionCount(gameId).catch(() => 0);
    lastSeen = cnt;
    if (cnt >= expectedTotal) break;
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log(`[finalizePredictions] entries seen on-chain: ${lastSeen}/${expectedTotal}`);

  const txHash = await client.writeContract({
    address: CONTRACT(),
    functionName: "finalize_predictions",
    args: [gameId, JSON.stringify(roundsMeta), currentWeek],
    value: BigInt(0),
    leaderOnly: true,
  });
  console.log("[finalizePredictions] tx:", txHash);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (client as any).waitForTransactionReceipt({
    hash: txHash,
    status: "ACCEPTED",
    retries: 120,
    interval: 3000,
  });

  const extracted = extractResult(tx);
  if (extracted) {
    extracted.results = extracted.results.map((r, i) => ({
      ...r,
      xp_earned: r.xp_earned ?? [500, 300, 150, 50, 50, 50][i] ?? 50,
    }));
    return extracted;
  }

  const full = await fetchFullReceipt(client, txHash);
  if (full) {
    const extracted2 = extractResult(full);
    if (extracted2) {
      extracted2.results = extracted2.results.map((r, i) => ({
        ...r,
        xp_earned: r.xp_earned ?? [500, 300, 150, 50, 50, 50][i] ?? 50,
      }));
      return extracted2;
    }
  }

  console.warn("[finalizePredictions] Could not extract scores — using XP snapshot");
  const xpAfter = new Map<string, number>();
  await Promise.all(allAddresses.map(async (addr) => {
    xpAfter.set(addr.toLowerCase(), await getPlayerXp(addr).catch(() => 0));
  }));
  const XP_TO_RANK: Record<number, number> = { 500: 1, 300: 2, 150: 3, 50: 4 };
  const ranked = allAddresses
    .map((addr) => ({ address: addr, xp_earned: Math.max(0, xpAfter.get(addr.toLowerCase()) ?? 0) }))
    .sort((a, b) => b.xp_earned - a.xp_earned);

  const topic = roundsMeta[0]?.topic ?? "";
  const results: PredictionResult[] = ranked.map((r, i) => ({
    address: r.address,
    plausibility: 0,
    originality: 0,
    hype_level: 0,
    would_actually_happen: 0,
    total: 0,
    rank: XP_TO_RANK[r.xp_earned] ?? (i + 1),
    roast: "Scores unavailable — check GenLayer explorer for details.",
    xp_earned: r.xp_earned,
  }));
  return { topic, results, winner: results[0]?.address ?? "" };
}

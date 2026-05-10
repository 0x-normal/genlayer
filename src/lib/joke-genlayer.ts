"use client";

import { createClient } from "genlayer-js";
import { getActiveChain, getContract } from "./chain";
import { extractFromReceipt, fetchFullReceipt } from "./extract-result";

const GAME = "joke_wars" as const;
const CONTRACT = () => getContract(GAME);

const readClient = () => createClient({ chain: getActiveChain() });
function writeClient(address: string) {
  return createClient({ chain: getActiveChain(), account: address as `0x${string}` });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JokeResult {
  address: string;
  funniness: number;
  originality: number;
  timing: number;
  groans: number;
  total: number;
  rank: number;
  roast: string;
  xp_earned: number;
}

export interface JokeJudgingResult {
  category: string;
  results: JokeResult[];
  winner: string;
  engine?: string;
}

export type JokeRoundMeta = { round: number; category: string };

// ── Read ──────────────────────────────────────────────────────────────────────

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

// ── Receipt parsing ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidResult(obj: any): obj is JokeJudgingResult {
  return obj && typeof obj === "object" &&
    Array.isArray(obj.results) && obj.results.length > 0 &&
    typeof obj.results[0]?.address === "string" &&
    typeof obj.winner === "string";
}

function extractResult(tx: unknown): JokeJudgingResult | null {
  return extractFromReceipt<JokeJudgingResult>(tx, isValidResult);
}

// ── Player-side: fire-and-forget per-round entry submission ──────────────────

/**
 * Each player calls this from their own wallet. The contract uses
 * `gl.message.sender_address` as authoritative authorship. We don't await the
 * receipt here — the host waits at finalize time for all entries to land.
 */
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
  console.log("[joke submitEntry]", { gameId, round, txHash });
  return txHash;
}

// ── Host-side: wait for entries, run AI judging ──────────────────────────────

export async function finalizeJokes(
  callerAddress: string,
  gameId: string,
  roundsMeta: JokeRoundMeta[],
  allAddresses: string[],
): Promise<JokeJudgingResult> {
  const currentWeek = Math.floor(Date.now() / 1000 / 604800);
  const client = writeClient(callerAddress);

  // Wait for all entries to land on chain (up to ~60s grace).
  const expectedTotal = allAddresses.length * roundsMeta.length;
  const startWait = Date.now();
  let lastSeen = 0;
  while (Date.now() - startWait < 60_000) {
    const cnt = await getSubmissionCount(gameId).catch(() => 0);
    lastSeen = cnt;
    if (cnt >= expectedTotal) break;
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log(`[finalizeJokes] entries seen on-chain: ${lastSeen}/${expectedTotal}`);

  const txHash = await client.writeContract({
    address: CONTRACT(),
    functionName: "finalize_jokes",
    args: [gameId, JSON.stringify(roundsMeta), currentWeek],
    value: BigInt(0),
    leaderOnly: true,
  });
  console.log("[finalizeJokes] tx:", txHash);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (client as any).waitForTransactionReceipt({
    hash: txHash,
    status: "ACCEPTED",
    retries: 120,
    interval: 3000,
  });

  const extracted = extractResult(tx);
  if (extracted) {
    console.log("[finalizeJokes] ✓ extracted AI scores from receipt");
    extracted.results = extracted.results.map((r, i) => ({
      ...r,
      xp_earned: r.xp_earned ?? [500, 300, 150, 50, 50, 50][i] ?? 50,
    }));
    return extracted;
  }

  console.log("[finalizeJokes] Trying getTransaction fallback...");
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

  // Last resort: XP snapshot.
  console.warn("[finalizeJokes] Could not extract scores — using XP snapshot");
  const xpAfter = new Map<string, number>();
  await Promise.all(allAddresses.map(async (addr) => {
    xpAfter.set(addr.toLowerCase(), await getPlayerXp(addr).catch(() => 0));
  }));
  const XP_TO_RANK: Record<number, number> = { 500: 1, 300: 2, 150: 3, 50: 4 };
  const ranked = allAddresses
    .map((addr) => ({ address: addr, xp_earned: Math.max(0, xpAfter.get(addr.toLowerCase()) ?? 0) }))
    .sort((a, b) => b.xp_earned - a.xp_earned);

  const category = roundsMeta[0]?.category ?? "";
  const results: JokeResult[] = ranked.map((r, i) => ({
    address: r.address,
    funniness: 0,
    originality: 0,
    timing: 0,
    groans: 0,
    total: 0,
    rank: XP_TO_RANK[r.xp_earned] ?? (i + 1),
    roast: "Scores unavailable — check GenLayer explorer for details.",
    xp_earned: r.xp_earned,
  }));
  return { category, results, winner: results[0]?.address ?? "" };
}

#!/usr/bin/env node
// Deploy all 5 PitchWars Intelligent Contracts to a chosen GenLayer network.
//
// Usage:
//   node scripts/deploy.mjs                                          # all contracts → studionet
//   node scripts/deploy.mjs studionet
//   node scripts/deploy.mjs testnetBradbury
//   node scripts/deploy.mjs testnetBradbury story_wars               # single contract
//   node scripts/deploy.mjs testnetBradbury story_wars prediction_wars
//
// Via npm:
//   npm run deploy:bradbury -- story_wars
//   npm run deploy:bradbury -- story_wars prediction_wars
//
// Requires:
//   - .env containing PRIVATE_KEY (or GENLAYER_PRIVATE_KEY)
//   - Run with `node --env-file=.env scripts/deploy.mjs <network>` (Node 20+)
//     OR set the env var beforehand.
//
// On success it prints a block of NEXT_PUBLIC_* lines you can paste into
// `.env.local` so the frontend picks up the new addresses.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount, chains } from "genlayer-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const NETWORK = (process.argv[2] ?? process.env.GENLAYER_NETWORK ?? "studionet").trim();
if (!chains[NETWORK]) {
  console.error(
    `Unknown network "${NETWORK}". Available: ${Object.keys(chains).join(", ")}`,
  );
  process.exit(1);
}

const PK =
  process.env.PRIVATE_KEY ||
  process.env.GENLAYER_PRIVATE_KEY ||
  process.env.NEXT_PUBLIC_PRIVATE_KEY;
if (!PK) {
  console.error(
    "No private key found. Set PRIVATE_KEY in .env (then run with `node --env-file=.env ...`).",
  );
  process.exit(1);
}

const account = createAccount(PK);
const client = createClient({ chain: chains[NETWORK], account });

// Each entry: source file in ./contracts, the env-key the frontend expects,
// and the GameKey used by src/lib/chain.ts (for diagnostics only).
const ALL_TARGETS = [
  { game: "pitch_wars",      file: "pitch_wars.py",      envKey: "NEXT_PUBLIC_STUDIONET_PITCH_WARS" },
  { game: "joke_wars",       file: "joke_wars.py",       envKey: "NEXT_PUBLIC_STUDIONET_JOKE_WARS" },
  { game: "excuse_wars",     file: "excuse_wars.py",     envKey: "NEXT_PUBLIC_STUDIONET_EXCUSE_WARS" },
  { game: "prediction_wars", file: "prediction_wars.py", envKey: "NEXT_PUBLIC_STUDIONET_PREDICTION_WARS" },
  { game: "story_wars",      file: "story_wars.py",      envKey: "NEXT_PUBLIC_STUDIONET_STORY_WARS" },
];

// Optional positional filter: any args after the network name are game names
// to deploy (defaults to all).
const FILTER = process.argv.slice(3).map((s) => s.trim()).filter(Boolean);
const VALID_GAMES = new Set(ALL_TARGETS.map((t) => t.game));
for (const g of FILTER) {
  if (!VALID_GAMES.has(g)) {
    console.error(
      `Unknown game "${g}". Valid: ${[...VALID_GAMES].join(", ")}`,
    );
    process.exit(1);
  }
}
const TARGETS =
  FILTER.length === 0 ? ALL_TARGETS : ALL_TARGETS.filter((t) => FILTER.includes(t.game));

// Per-network env-key prefix.
const ENV_PREFIX = NETWORK === "studionet" ? "NEXT_PUBLIC_STUDIONET_" : "NEXT_PUBLIC_BRADBURY_";

console.log(
  `[deploy] network=${NETWORK} deployer=${account.address} targets=${TARGETS.map((t) => t.game).join(",")}\n`,
);

const out = {};
for (const t of TARGETS) {
  const codePath = path.join(ROOT, "contracts", t.file);
  const code = await readFile(codePath);
  const sizeKB = (code.length / 1024).toFixed(1);
  console.log(`[deploy] ${t.game.padEnd(16)} (${sizeKB} KB)`);

  const txHash = await client.deployContract({ code, args: [], leaderOnly: false });
  console.log(`           tx: ${txHash}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "ACCEPTED",
    retries: 200,
    interval: 3000,
  });

  // Detect validator-level constructor failures even though tx status is ACCEPTED.
  // `leader_receipt[0].result` is the structured GenVM result; status != "return"
  // means the constructor was rejected (e.g. `contract_error: invalid_contract`).
  const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
  const gvmResult = leaderReceipt?.result;
  if (gvmResult && gvmResult.status && gvmResult.status !== "return") {
    const payload = gvmResult.payload ?? "(no payload)";
    const stderr = leaderReceipt?.genvm_result?.stderr ?? "";
    console.error(
      `           ERROR: ${t.game} constructor rejected → ${gvmResult.status}: ${payload}`,
    );
    if (stderr) console.error(`           stderr:\n${stderr}`);
    process.exit(1);
  }

  const addr =
    receipt?.data?.contract_address ||
    receipt?.to_address ||
    receipt?.recipient;

  if (!addr) {
    console.error(`           ERROR: no contract address in receipt for ${t.game}.`);
    console.error("           receipt keys:", Object.keys(receipt ?? {}).join(","));
    process.exit(1);
  }

  console.log(`           addr: ${addr}\n`);

  // Override the file's env-key to match the network we're deploying to.
  const envKey = t.envKey.replace("NEXT_PUBLIC_STUDIONET_", ENV_PREFIX);
  out[envKey] = addr;
}

console.log("─".repeat(60));
console.log(`Done. Add these lines to ${NETWORK === "studionet" ? ".env.local" : "your env"}:`);
console.log("─".repeat(60));
for (const [k, v] of Object.entries(out)) {
  console.log(`${k}=${v}`);
}
console.log("─".repeat(60));
console.log("Then restart `npm run dev`.");

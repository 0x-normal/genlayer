"use client";

// Central GenLayer chain & contract registry.
//
// Two networks are supported: studionet (default, fastest) and testnetBradbury
// (the original deployment). The active choice is persisted to localStorage so
// it survives reloads. A `chainchange` window event is dispatched when the
// user toggles, so any component watching it can re-render.

import { chains } from "genlayer-js";

export type GameKey =
  | "pitch_wars"
  | "joke_wars"
  | "excuse_wars"
  | "prediction_wars"
  | "story_wars";

export type NetworkId = "studionet" | "testnetBradbury";

const STORAGE_KEY = "pw.network";
export const CHAIN_CHANGE_EVENT = "pw:chainchange";

// ── Per-network contract addresses ───────────────────────────────────────────
// testnetBradbury values are the addresses already deployed; studionet values
// come from environment variables filled in by `npm run deploy`.
const CONTRACTS: Record<NetworkId, Record<GameKey, string>> = {
  studionet: {
    pitch_wars: process.env.NEXT_PUBLIC_STUDIONET_PITCH_WARS ?? "",
    joke_wars: process.env.NEXT_PUBLIC_STUDIONET_JOKE_WARS ?? "",
    excuse_wars: process.env.NEXT_PUBLIC_STUDIONET_EXCUSE_WARS ?? "",
    prediction_wars: process.env.NEXT_PUBLIC_STUDIONET_PREDICTION_WARS ?? "",
    story_wars: process.env.NEXT_PUBLIC_STUDIONET_STORY_WARS ?? "",
  },
  testnetBradbury: {
    // Env vars take precedence so users can redeploy individual contracts via
    // `npm run deploy:bradbury -- <game>` without editing source. Defaults
    // below are the original deployment.
    pitch_wars:
      process.env.NEXT_PUBLIC_BRADBURY_PITCH_WARS ||
      "0x7CEfF93f76946045a19a6D33Af99b7A0d45bf8f1",
    joke_wars:
      process.env.NEXT_PUBLIC_BRADBURY_JOKE_WARS ||
      "0x3f637A45913d5cf917FEA4253e77C76337891782",
    excuse_wars:
      process.env.NEXT_PUBLIC_BRADBURY_EXCUSE_WARS ||
      "0x00Edd046643839fa6Fa9bd548eD1d1206318564E",
    prediction_wars:
      process.env.NEXT_PUBLIC_BRADBURY_PREDICTION_WARS ||
      "0x8e9D9bAAF02d2972454d77f455A7E413394764ba",
    story_wars:
      process.env.NEXT_PUBLIC_BRADBURY_STORY_WARS ||
      "0x47e62d3aCedb445f97513f8e83cd612b22d50FB0",
  },
};

export const NETWORK_LABELS: Record<NetworkId, string> = {
  studionet: "Studionet",
  testnetBradbury: "Bradbury Testnet",
};

export const NETWORK_DESCRIPTIONS: Record<NetworkId, string> = {
  studionet:
    "Fast iteration network — best for casual play and dev testing.",
  testnetBradbury:
    "Long-lived public testnet — slower but persistent.",
};

const DEFAULT_NETWORK: NetworkId = "studionet";

// ── State (localStorage-backed) ──────────────────────────────────────────────

function readStored(): NetworkId {
  if (typeof window === "undefined") return DEFAULT_NETWORK;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "studionet" || v === "testnetBradbury") return v;
  return DEFAULT_NETWORK;
}

export function getActiveNetwork(): NetworkId {
  return readStored();
}

export function setActiveNetwork(id: NetworkId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(CHAIN_CHANGE_EVENT, { detail: id }));
}

export function getActiveChain() {
  return chains[getActiveNetwork()];
}

export function getContract(game: GameKey): `0x${string}` {
  const id = getActiveNetwork();
  const addr = CONTRACTS[id][game];
  if (!addr) {
    throw new Error(
      `Contract for "${game}" is not configured on ${id}. ` +
        `Run \`npm run deploy\` to deploy and fill .env.local, or switch network.`,
    );
  }
  return addr as `0x${string}`;
}

export function isNetworkConfigured(id: NetworkId): boolean {
  return Object.values(CONTRACTS[id]).every((a) => a && a.length > 0);
}

export function listNetworks(): NetworkId[] {
  return ["studionet", "testnetBradbury"];
}

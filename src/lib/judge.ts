"use client";

import type { JudgingResult, PitchResult } from "./genlayer";

// ── Buzzword detection ─────────────────────────────────────────────────────
const BUZZWORDS = [
  "ai", "blockchain", "web3", "synergy", "disrupt", "pivot", "scale",
  "leverage", "paradigm", "ecosystem", "tokenize", "defi", "nft",
  "metaverse", "dao", "decentraliz", "protocol", "layer", "consensus",
  "smart contract", "machine learning", "deep learning", "neural",
  "saas", "b2b", "b2c", "mvp", "roi", "kpi", "moat", "unicorn",
  "10x", "moonshot", "rocket", "million", "billion", "trillion",
  "revolutionary", "game-chang", "world-first", "unprecedented",
  "vertical", "horizontal", "full-stack", "end-to-end", "seamless",
  "frictionless", "democratiz", "empower", "unlock", "optimize",
  "monetiz", "gamif", "incentiviz", "stakeholder", "value prop",
  "product-market fit", "hockey stick", "growth hack", "viral",
  "flywheel", "network effect", "first-mover", "blue ocean",
  "runway", "burn rate", "series a", "pre-seed", "seed",
  "gpus", "cloud", "edge computing", "real-time", "api",
  "platform", "marketplace", "subscription", "freemium",
];

const ROASTS: Record<string, string[]> = {
  high: [
    "Shut up and take my money — said no one ever, but almost.",
    "You speak fluent VC. Unfortunately, that's not a compliment.",
    "I've seen worse pitches funded. You're in the danger zone of 'almost good.'",
    "Your deck would survive 30 seconds before a partner checks their phone.",
    "Impressive buzzword density. The pitch itself? Debatable.",
    "This is either genius or insanity. The market will decide.",
  ],
  mid: [
    "It's giving... Series Seed energy at best.",
    "Your pivot game is strong, but pivot away from this idea.",
    "I'd invest — if I was laundering money. Which I'm not. Legally.",
    "You clearly read TechCrunch. Did you also read a business book?",
    "This pitch has pre-revenue startup energy. Forever pre-revenue.",
    "Somewhere, a YC partner just felt a disturbance in the force.",
  ],
  low: [
    "This isn't a pitch, it's a cry for help.",
    "I've seen better pitches at a baseball game.",
    "Did you generate this with ChatGPT? Even it would be embarrassed.",
    "Your startup would disrupt exactly one thing: your bank account.",
    "The only thing scaling here is my disappointment.",
    "Pass. Hard pass. Titanium-reinforced pass.",
  ],
};

// ── Scoring engine ─────────────────────────────────────────────────────────

function countBuzzwords(text: string): number {
  const lower = text.toLowerCase();
  return BUZZWORDS.reduce((count, bw) => count + (lower.includes(bw) ? 1 : 0), 0);
}

function scoreInvestability(pitch: string): number {
  let score = 3; // base
  const len = pitch.length;
  if (len > 100) score += 1;
  if (len > 200) score += 1;
  if (len > 300) score += 1;
  // Look for money/market references
  if (/\$|\bmarket\b|\brevenue\b|\bprofit\b|\bgrowth\b/i.test(pitch)) score += 1;
  // Look for problem/solution structure
  if (/\bproblem\b|\bsolv/i.test(pitch)) score += 1;
  if (/\bsolution\b|\bfix/i.test(pitch)) score += 1;
  // Random VC mood
  score += Math.random() > 0.5 ? 1 : 0;
  return Math.min(10, Math.max(1, score));
}

function scoreOriginality(pitch: string): number {
  let score = 4; // base
  const len = pitch.length;
  if (len > 150) score += 1;
  // Unique words ratio
  const words = pitch.toLowerCase().split(/\s+/);
  const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
  if (uniqueRatio > 0.7) score += 2;
  else if (uniqueRatio > 0.5) score += 1;
  // Creativity markers
  if (/!{2,}|\?{2,}|🚀|💡|🔥|⚡/u.test(pitch)) score += 1;
  if (/imagine|picture this|what if/i.test(pitch)) score += 1;
  score += Math.random() > 0.6 ? 1 : 0;
  return Math.min(10, Math.max(1, score));
}

function scoreBuzzwordDensity(pitch: string): number {
  const count = countBuzzwords(pitch);
  if (count >= 8) return Math.min(10, 8 + Math.floor(Math.random() * 3));
  if (count >= 5) return Math.min(10, 6 + Math.floor(Math.random() * 3));
  if (count >= 3) return Math.min(10, 4 + Math.floor(Math.random() * 3));
  if (count >= 1) return Math.min(10, 2 + Math.floor(Math.random() * 3));
  return Math.max(1, Math.floor(Math.random() * 3));
}

function scoreHumor(pitch: string): number {
  let score = 3;
  // Look for humor indicators
  if (/lol|lmao|haha|😂|🤣|😭/i.test(pitch)) score += 2;
  if (/joke|funny|hilarious|absurd|ridiculous/i.test(pitch)) score += 1;
  // Exclamation marks = enthusiasm
  const exclamations = (pitch.match(/!/g) || []).length;
  if (exclamations >= 3) score += 1;
  // Caps lock = passion
  const capsWords = (pitch.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsWords >= 2) score += 1;
  // Length bonus 
  if (pitch.length > 200) score += 1;
  score += Math.random() > 0.4 ? 1 : 0;
  return Math.min(10, Math.max(1, score));
}

function getRoast(total: number): string {
  const tier = total >= 28 ? "high" : total >= 18 ? "mid" : "low";
  const pool = ROASTS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Main judge function ────────────────────────────────────────────────────

export function judgeLocally(
  combo: string,
  pitches: { address: string; pitch: string }[]
): JudgingResult {
  const results: PitchResult[] = pitches.map((p) => {
    const investability = scoreInvestability(p.pitch);
    const originality = scoreOriginality(p.pitch);
    const buzzword_density = scoreBuzzwordDensity(p.pitch);
    const humor = scoreHumor(p.pitch);
    const total = investability + originality + buzzword_density + humor;

    return {
      address: p.address,
      investability,
      originality,
      buzzword_density,
      humor,
      total,
      rank: 0, // filled below
      roast: "",
      xp_earned: 0,
    };
  });

  // Sort by total score descending
  results.sort((a, b) => b.total - a.total);

  // Break ties with slight random nudge
  for (let i = 1; i < results.length; i++) {
    if (results[i].total === results[i - 1].total) {
      if (Math.random() > 0.5) {
        [results[i], results[i - 1]] = [results[i - 1], results[i]];
      }
    }
  }

  // Assign ranks, roasts, and XP
  const RANK_XP: Record<number, number> = { 1: 500, 2: 300, 3: 150, 4: 50, 5: 50, 6: 50 };
  results.forEach((r, i) => {
    r.rank = i + 1;
    r.roast = getRoast(r.total);
    r.xp_earned = RANK_XP[r.rank] || 50;
  });

  return {
    combo,
    results,
    winner: results[0].address,
  };
}

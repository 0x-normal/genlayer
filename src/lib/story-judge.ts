import type { StoryJudgingResult, StoryResult } from "./story-genlayer";

export function judgeStoriesLocally(
  prompt_combo: string,
  rounds: { round: number; prompt_combo: string; stories: { address: string; story: string }[] }[]
): StoryJudgingResult {
  const RANK_XP = [500, 300, 150, 50, 50, 50];

  // Aggregate all answers per player across all rounds
  const playerMap = new Map<string, { address: string; allText: string }>();
  for (const round of rounds) {
    for (const p of round.stories) {
      const key = p.address.toLowerCase();
      const existing = playerMap.get(key);
      if (existing) {
        existing.allText += " " + p.story;
      } else {
        playerMap.set(key, { address: p.address, allText: p.story });
      }
    }
  }

  const players = Array.from(playerMap.values());

  const results: StoryResult[] = players.map((p) => {
    const len = p.allText.length;
    const words = p.allText.split(/\s+/).length;
    const uniqueWords = new Set(p.allText.toLowerCase().split(/\s+/)).size;
    const avgWordLen = len / Math.max(words, 1);
    const s1 = Math.min(10, Math.max(3, Math.round(Math.min(uniqueWords / 8, 10))));
    const s2 = Math.min(10, Math.max(3, Math.round(Math.min(uniqueWords / 6, 10))));
    const s3 = Math.min(10, Math.max(3, Math.round(Math.min(avgWordLen * 1.2, 10))));
    const s4 = Math.min(10, Math.max(3, Math.round(Math.min(words / 15, 10))));
    const total = s1 + s2 + s3 + s4;
    return {
      address: p.address,
      storytelling: s1,
      economy_of_words: s2,
      emotion: s3,
      twist_quality: s4,
      total,
      rank: 0,
      roast: "GenLayer unavailable — scored locally on writing quality.",
      xp_earned: 0,
    };
  });

  results.sort((a, b) => b.total - a.total);
  results.forEach((r, i) => { r.rank = i + 1; r.xp_earned = RANK_XP[i] ?? 50; });
  return { prompt_combo, results, winner: results[0]?.address ?? "" };
}
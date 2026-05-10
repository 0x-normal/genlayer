export interface JokeResult {
  address: string;
  funniness: number;
  originality: number;
  timing: number;
  groans: number; // groan-worthiness — the highest honour in comedy
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

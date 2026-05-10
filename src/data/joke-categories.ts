export const JOKE_CATEGORIES = [
  "Food & Cooking",
  "Marriage & Relationships",
  "Work & Office Life",
  "School & Teachers",
  "Doctors & Hospitals",
  "Parents & Children",
  "Neighbors",
  "Traffic & Driving",
  "Gym & Fitness",
  "Shopping & Supermarkets",
  "Monday Mornings",
  "Social Media",
  "Airports & Travel",
  "Pets",
  "Weather",
  "Getting Old",
  "Money & Taxes",
  "Sleep & Alarm Clocks",
  "Diets",
  "Public Transport",
];

export function pickCategory(seed?: number): string {
  if (seed !== undefined) return JOKE_CATEGORIES[seed % JOKE_CATEGORIES.length];
  return JOKE_CATEGORIES[Math.floor(Math.random() * JOKE_CATEGORIES.length)];
}
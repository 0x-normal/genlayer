export const PREDICTION_TOPICS = [
  "The future of work from home",
  "What replaces smartphones",
  "The next big diet trend",
  "How we'll watch movies in 10 years",
  "The future of dating",
  "What happens to cities in 20 years",
  "How schools will change",
  "The next global sport craze",
  "What replaces coffee",
  "The future of fast food",
  "How people will commute in 2040",
  "What the next big social network looks like",
  "The future of supermarkets",
  "How fashion will change in 10 years",
  "What jobs disappear first",
  "The next big fitness trend",
  "How music will be made in 2035",
  "What replaces email",
  "The future of holidays and travel",
  "How cooking at home will change",
];

export function pickTopic(seed?: number): string {
  if (seed !== undefined) return PREDICTION_TOPICS[seed % PREDICTION_TOPICS.length];
  return PREDICTION_TOPICS[Math.floor(Math.random() * PREDICTION_TOPICS.length)];
}
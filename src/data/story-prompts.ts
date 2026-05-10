const GENRES = [
  "Romance",
  "Horror",
  "Comedy",
  "Thriller",
  "Drama",
  "Mystery",
  "Sci-Fi",
  "Fairy Tale",
  "Western",
  "Adventure",
];

const SETTINGS = [
  "in a dentist's waiting room",
  "at a family Christmas dinner",
  "on a first date gone wrong",
  "in a traffic jam",
  "at a job interview",
  "in a hospital elevator",
  "at the gym on New Year's Day",
  "in a supermarket checkout line",
  "at a high school reunion",
  "on a delayed flight",
  "in a broken-down elevator",
  "at a neighbor's barbecue",
  "during a power outage",
  "at the last table in a fully booked restaurant",
  "in a laundromat at midnight",
];

export function pickStoryPrompt(seed?: number): string {
  if (seed !== undefined) {
    const genre = GENRES[seed % GENRES.length];
    const setting = SETTINGS[Math.floor(seed / GENRES.length) % SETTINGS.length];
    return `${genre} · ${setting}`;
  }
  const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
  const setting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
  return `${genre} · ${setting}`;
}
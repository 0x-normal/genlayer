export const CRIMES = [
  "You ate your roommate's food",
  "You ghosted someone after 3 months of dating",
  "You showed up 45 minutes late to your own birthday dinner",
  "You fell asleep during your friend's wedding speech",
  "You forgot your partner's birthday",
  "You regifted a present someone gave you",
  "You lied about reading the book for book club",
  "You pretended to be sick to skip a family gathering",
  "You talked in the movie theater",
  "You took the last piece of pizza without asking",
  "You said 'I'm 5 minutes away' when you haven't left yet",
  "You replied to an email 3 months late",
  "You put an empty milk carton back in the fridge",
  "You borrowed money and 'forgot' to pay it back",
  "You used someone else's Netflix and changed all their recommendations",
  "You ignored someone's call and then immediately texted 'what's up'",
  "You double-booked two friends on the same night",
  "You ate at a restaurant and left a 5% tip",
  "You lied about your age on a dating app",
  "You cancelled plans over text 10 minutes before",
];

export function pickCrime(seed?: number): string {
  if (seed !== undefined) return CRIMES[seed % CRIMES.length];
  return CRIMES[Math.floor(Math.random() * CRIMES.length)];
}
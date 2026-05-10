// Absurd startup combo generator
// Format: [Tech/Trend] + [Unexpected everyday product/market]

const TECH = [
  "AI-Powered",
  "Subscription-Based",
  "On-Demand",
  "Crowdsourced",
  "App-Connected",
  "Automated",
  "Smart",
  "Eco-Friendly",
  "Premium",
  "Community-Driven",
  "Data-Driven",
  "Personalized",
  "Hyper-Local",
  "Social",
  "Gamified",
  "Voice-Activated",
  "Peer-to-Peer",
  "Membership-Based",
  "Franchise",
  "Pop-Up",
];

const PRODUCT = [
  "Dog Walking",
  "Sandwich Delivery",
  "Nap Pods",
  "Grandma's Recipes",
  "Parking Spots",
  "Haircuts for Cats",
  "Speed Dating",
  "Lawn Care",
  "Horoscope Reading",
  "Sock Matching",
  "Elevator Music",
  "Toothbrush Subscription",
  "Plant Watering",
  "Lost Remote Finders",
  "Homework Excuses",
  "Baby Photos",
  "Wedding Planning",
  "Pizza Crust",
  "Bedtime Stories",
  "Eyebrow Threading",
  "Handshake Training",
  "Birthday Cake Delivery",
  "Parking Ticket Disputes",
  "Grocery List Optimization",
  "Husband Rental",
  "Ironing Service",
  "Queue Skipping",
  "Office Snack Curation",
  "Motivational Alarm Clocks",
  "Professional Apologizing",
];

export function generateCombo(): string {
  const tech = TECH[Math.floor(Math.random() * TECH.length)];
  const product = PRODUCT[Math.floor(Math.random() * PRODUCT.length)];
  return `${tech} ${product}`;
}

export function generateComboSeeded(seed: number): string {
  const techIdx = seed % TECH.length;
  const prodIdx = Math.floor(seed / TECH.length) % PRODUCT.length;
  return `${TECH[techIdx]} ${PRODUCT[prodIdx]}`;
}
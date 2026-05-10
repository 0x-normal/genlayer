import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "Wars Arena — 5 Multiplayer AI-Judged Games on GenLayer",
  description:
    "5 multiplayer party games — Pitch Wars, Joke Wars, Excuse Wars, Prediction Wars, Story Wars. Submit your answers, get judged by on-chain AI validators via GenLayer's Optimistic Democracy, earn XP, and climb the global leaderboard.",
  openGraph: {
    title: "Wars Arena — 5 Multiplayer AI-Judged Games on GenLayer",
    description:
      "5 multiplayer party games judged by on-chain AI validators via GenLayer's Optimistic Democracy consensus.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#06060e] text-white min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
# ⚡ Pitch Wars — AI-Judged Startup Pitches on GenLayer

A multiplayer party game where players pitch absurd startups, get judged by on-chain AI validators via GenLayer's Optimistic Democracy consensus, earn XP, and climb the global leaderboard.

## 🎮 How It Works

1. **Create or Join a Room** — Host generates a 6-character code, others join via PeerJS P2P
2. **Get Your Combo** — Everyone gets the same absurd startup combo (e.g. "Blockchain Diapers")
3. **Pitch It** — 90 seconds to write your best VC pitch
4. **AI Judges On-Chain** — GenLayer AI validators score pitches on Investability, Originality, Buzzword Density, and Humor
5. **Results & Roasts** — Scores revealed with VC roasts, XP distributed on-chain
6. **Leaderboard** — Global rankings stored in the Intelligent Contract

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────────┐ │
│  │MainMenu │→ │ Lobby   │→ │PitchRound│→ │ Results   │ │
│  │         │  │(PeerJS) │  │(90s timer)│  │(XP reveal)│ │
│  └─────────┘  └─────────┘  └──────────┘  └───────────┘ │
│       ↕              ↕             ↕             ↕       │
│  ┌──────────────────────────────────────────────────┐   │
│  │        RainbowKit + Wagmi (Wallet Connect)       │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                           │
                    writeContract / readContract
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              GenLayer Bradbury Testnet                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │         pitch_wars.py (Intelligent Contract)      │   │
│  │                                                    │   │
│  │  submit_pitches() ─→ gl.nondet.exec_prompt()     │   │
│  │                    ─→ gl.eq_principle.strict_eq() │   │
│  │                    ─→ XP distribution             │   │
│  │                                                    │   │
│  │  get_leaderboard() ─→ sorted TreeMap              │   │
│  │  get_player_xp()   ─→ per-address XP              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Optimistic Democracy Consensus:                         │
│  Multiple AI validators independently score pitches,     │
│  must reach consensus via strict equality matching.       │
└──────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Wallet | RainbowKit, Wagmi, viem |
| Multiplayer | PeerJS (WebRTC P2P) |
| Blockchain | GenLayer Bradbury Testnet (Chain ID: 4221) |
| Smart Contract | GenLayer Intelligent Contract (Python) |
| AI Consensus | Optimistic Democracy via `genlayer-js` |
| Contract SDK | `genlayer-js ^0.23.1` |

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy the Intelligent Contract

Deploy `contracts/pitch_wars.py` to GenLayer Bradbury Testnet:

- Go to GenLayer CLI 
- Create a new contract
- Paste the contents of `contracts/pitch_wars.py`
- Deploy to Bradbury Testnet
- Copy the deployed contract address

### 3. Configure Contract Address

Edit `src/lib/genlayer.ts` and replace the placeholder:

```typescript
const CONTRACT = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS" as const;
```

### 4. Configure WalletConnect (Optional)

Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com) and update `src/app/Providers.tsx`:

```typescript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📝 Contract Methods

### Write Methods

- **`submit_pitches(combo, pitches_json, current_week)`** — Submit all pitches for AI judging. Returns scored results with XP awards. Each player scores on 4 criteria (0-10 each), ranked by total score.

### View Methods

- **`get_leaderboard()`** — Top 50 players by XP
- **`get_player_xp(player)`** — Single player's total XP
- **`get_player_stats(player)`** — XP + games played
- **`get_last_played_week(player)`** — Weekly play limit check

## 🎯 Scoring System

| Criteria | Range | Description |
|----------|-------|-------------|
| Investability | 0-10 | Would VCs actually invest? |
| Originality | 0-10 | How creative is the pitch? |
| Buzzword Density | 0-10 | Startup jargon mastery |
| Humor | 0-10 | Entertainment value |

### XP Distribution

| Rank | XP Earned |
|------|-----------|
| 🏆 1st | 500 XP |
| 🥈 2nd | 300 XP |
| 🥉 3rd | 150 XP |
| 4th+ | 50 XP |


## 📁 Project Structure

```
pitch-wars/
├── contracts/
│   └── pitch_wars.py          # GenLayer Intelligent Contract
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind + custom theme
│   │   ├── layout.tsx          # Root layout with Providers
│   │   ├── page.tsx            # Main game orchestrator
│   │   └── Providers.tsx       # RainbowKit + Wagmi setup
│   ├── components/
│   │   ├── MainMenu.tsx        # Landing screen + wallet connect
│   │   ├── Lobby.tsx           # Room create/join + player list
│   │   ├── PitchRound.tsx      # 90s pitch writing phase
│   │   ├── ConsensusLoader.tsx # AI judging animation
│   │   ├── Results.tsx         # Score reveal + roasts + XP
│   │   └── Leaderboard.tsx     # Global XP rankings
│   ├── data/
│   │   └── combos.ts           # Absurd startup combo generator
│   └── lib/
│       ├── genlayer.ts         # GenLayer read/write client
│       └── network.ts          # PeerJS P2P multiplayer
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

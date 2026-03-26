# GHOST — Guided Heuristic Onboard Survival Tactician

An AI survival companion built **inside** EVE Frontier. Fly to a GHOST Terminal, press F, and your AI wingman reads the chain and keeps you alive.

**EVE Frontier x Sui Hackathon 2026** | Theme: "A Toolkit for Civilization"

---

## What is GHOST?

GHOST is an AI companion system that exists physically within the EVE Frontier game world. It's not an external tool — it's a Smart Storage Unit you can fly to in Stillness, interact with, and get real-time survival intelligence.

When you approach a GHOST Terminal and press F, the game's built-in browser opens the GHOST dApp. GHOST reads your on-chain state (fuel, hull, location, nearby threats) and provides:

- **Real-time survival dashboard** — fuel, HP, threat level at a glance
- **Heuristic alerts** — fuel warnings, threat detection, stranding prevention
- **AI chat companion** — ask questions about game mechanics, get tactical advice
- **Knowledge base** — curated EVE Frontier survival knowledge via RAG

## Architecture

GHOST has three layers:

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: ON-CHAIN (Sui Move)                   │
│  Ghost Terminal SSU Extension                    │
│  → Deployed as Smart Storage Unit in Stillness   │
│  → Emits GhostActivation events                  │
│  → Players fly to it and press F                 │
├─────────────────────────────────────────────────┤
│  LAYER 2: IN-GAME dApp (Next.js)                │
│  → Loads inside EVE Frontier game client         │
│  → Connected via SSU's custom dApp URL           │
│  → Sui wallet (EVE Vault) integration            │
│  → Real-time WebSocket updates                   │
├─────────────────────────────────────────────────┤
│  LAYER 3: OFF-CHAIN SERVICE (Node.js)           │
│  → Reads on-chain state via Sui SDK              │
│  → Context engine: player state aggregation      │
│  → Heuristic alert engine (no LLM needed)        │
│  → AI chat with RAG knowledge base               │
└─────────────────────────────────────────────────┘
```

## How It Connects to the Game

1. **Deploy the GHOST Terminal SSU** to Stillness (EVE Frontier's production server)
2. **Set the custom dApp URL** on the SSU to point to the deployed GHOST dApp (e.g., `https://ghost-efh.vercel.app/?tenant=stillness&itemId=TERMINAL_ID`)
3. **Players fly to the terminal** in-game, press F, and the GHOST dApp opens in the game's built-in browser
4. **The dApp connects** to the player's EVE Vault wallet and the GHOST backend
5. **GHOST reads on-chain state** and provides real-time survival intelligence

Per the EVE Frontier docs: *"Units may have an associated external URL for a website built and maintained by the unit's owner."*

---

## Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI (`cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui`)
- Docker (for builder-scaffold local development)

### 1. Clone and Setup

```bash
git clone https://github.com/daryllim/ghost-efh.git
cd ghost-efh
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 2. Smart Contract (Layer 1)

```bash
# Option A: Build locally with Sui CLI
cd contracts/ghost_terminal
sui move build

# Option B: Use builder-scaffold Docker environment
git clone https://github.com/evefrontier/builder-scaffold.git
cd builder-scaffold
docker compose up -d
# Copy ghost_terminal package into scaffold, build and test
```

#### Deploy to Testnet
```bash
sui client publish --gas-budget 100000000
# Note the published package ID → set GHOST_PACKAGE_ID in .env
```

#### Deploy to Stillness (Production)
```bash
# Switch to mainnet
sui client switch --env mainnet
sui client publish --gas-budget 100000000
# After publishing, register the terminal:
sui client call --package $GHOST_PACKAGE_ID --module ghost_terminal --function register_terminal \
  --args $REGISTRY_ID $SSU_ITEM_ID "GHOST Terminal Alpha" $CLOCK_ID \
  --gas-budget 10000000
```

#### Set Custom dApp URL
In the EVE Frontier game client:
1. Navigate to your deployed SSU
2. Open the SSU management interface
3. Set the custom URL to: `https://your-ghost-domain.vercel.app/?tenant=stillness&itemId=YOUR_SSU_ITEM_ID`

Alternatively, use `efctl` or a sponsored transaction to set the URL programmatically.

### 3. Backend (Layer 3)

```bash
cd packages/backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

### 4. dApp (Layer 2)

```bash
cd packages/dapp
npm install
npm run dev
# dApp runs on http://localhost:3000
```

### 5. Demo Mode

To run with mock data (no Sui connection needed):

```bash
# In .env:
NEXT_PUBLIC_DEMO_MODE=true
DEMO_MODE=true
```

Demo mode simulates a connected player with:
- Dashboard populates immediately on connect
- Fuel warning triggers at ~10 seconds
- Hostile detection at ~20 seconds
- Chat works (with LLM if API key set, scripted fallback if not)

---

## Project Structure

```
ghost-efh/
├── contracts/
│   └── ghost_terminal/          # Sui Move SSU extension
│       ├── Move.toml
│       └── sources/
│           └── ghost_terminal.move
├── packages/
│   ├── backend/                 # Off-chain service (Fastify + WebSocket)
│   │   └── src/
│   │       ├── sui/             # Sui chain reader
│   │       ├── context/         # Player state aggregation
│   │       ├── alerts/          # Heuristic alert engine
│   │       ├── chat/            # AI chat with RAG
│   │       └── api/             # HTTP + WebSocket server
│   └── dapp/                    # In-game dApp (Next.js)
│       └── src/
│           ├── components/      # UI components
│           ├── hooks/           # React hooks
│           ├── lib/             # API client, types
│           └── providers/       # Sui wallet provider
└── knowledge/                   # RAG knowledge base
    ├── tutorial/                # Getting started guides
    ├── mechanics/               # Game mechanics reference
    ├── survival/                # Survival tips
    ├── economy/                 # Trading and crafting
    └── meta/                    # Cycle 5, glossary
```

## Hackathon Categories

### Live Frontier Integration
GHOST is deployed as a physical Smart Storage Unit in Stillness. Judges can fly to it, press F, and use the AI companion in-game. The SSU extension emits on-chain events, the dApp loads in the game browser, and the backend reads live chain state.

### Best Use of Sui
- On-chain SSU extension (Sui Move) with typed witness authentication
- Real-time chain state reading via SuiClient and GraphQL
- Event polling for GhostActivation tracking
- Wallet integration via Sui Wallet Standard (EVE Vault compatible)

### Tooling Innovation
GHOST is a "Toolkit for Civilization" — it's infrastructure that helps players survive. The heuristic alert system, knowledge base, and AI companion make the harsh game world more navigable for newcomers while providing useful intel to veterans.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Sui Move |
| Backend | TypeScript, Fastify, @mysten/sui |
| dApp | Next.js 14, React 18, TailwindCSS |
| Wallet | @mysten/dapp-kit (Sui Wallet Standard) |
| AI | Anthropic Claude / OpenAI (configurable) |
| Knowledge | Markdown RAG with keyword matching |

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `GHOST_PACKAGE_ID` — Set after publishing the Move contract
- `WORLD_PACKAGE_ID` — EVE Frontier world contracts package ID
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — For AI chat
- `NEXT_PUBLIC_DEMO_MODE` — Enable demo mode for testing

## License

MIT

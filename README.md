# Tallyx

> Blockchain-verified utang infrastructure for micro-retailers.

## 🧩 Problem

Millions of sari-sari store owners and micro-retailers across the Philippines still manage utang (informal credit) through notebooks, chat messages, or memory. This works for daily trust-based selling — but creates real problems as the store grows:

- Balances are easy to forget or dispute
- Payment history is hard to prove
- Receivables are not structured as financial data
- Store owners cannot see overdue or active credits at a glance
- Informal credit stays invisible to digital finance tools

There is no affordable, simple tool built for the informal credit realities of Filipino micro-retailers.

## 🌟 Vision

A future where every sari-sari store owner has a clear, verifiable receivables ledger — one that works offline, stays simple, and creates a financial paper trail that can be used to access formal credit, prove business health, or build trust with customers.

Tallyx is the first step: turn the utang notebook into a structured, blockchain-anchored ledger without making it feel like a crypto product.

## 🎯 Purpose

We built Tallyx because the informal credit system is not broken — it is just invisible. Store owners already extend credit every day. They already track it. They just lack the tools to make that data useful, verifiable, and persistent.

Tallyx keeps the simplicity of the traditional utang workflow, then adds structure, visibility, and an optional Stellar blockchain verification trail.

## 👥 Target Users

- **Sari-sari store owners** — primary users managing daily credit and collections
- **Small neighborhood retailers** — tiangge vendors, market stalls, and community shops
- **Micro-entrepreneurs** — any small business owner extending informal credit to repeat customers

## ✨ Features

- **Customer management** — add customers with QR identity and track total outstanding balance
- **Credit recording** — log credit given with amount, due date, notes, and status tracking
- **Payment recording** — record cash or USDC payments with full history per credit
- **Dashboard** — live view of total receivables, overdue amount, active customers, and recent activity
- **Blockchain sync** — credits and payments optionally verified on Stellar Soroban with transaction hash references
- **Offline-first** — local SQLite cache so the app works without internet; syncs when connection returns
- **QR scanning** — scan customer QR codes to instantly load their profile and credits
- **Sync status** — per-record status: `local`, `pending`, `syncing`, `synced`, or `failed`

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Mobile | Expo SDK 55, React Native, Expo Router, TypeScript |
| Mobile state | Zustand, SQLite (expo-sqlite), Expo SecureStore |
| Mobile UI | NativeWind, Lucide React Native, Gorhom Bottom Sheet |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Validation / Auth | Zod, JWT, bcrypt |
| Blockchain | Stellar SDK, Soroban SDK, Rust, Stellar CLI |
| Deployment | Railway (backend), EAS (mobile OTA) |

## 🚀 How to Run Locally

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Expo CLI via `npx expo`
- Stellar CLI for contract work

### Mobile

```bash
cd tallyx-mobile
npm install
npx expo start
```

### Backend

```bash
# Start PostgreSQL
docker compose up postgres

# Start backend
cd tallyx-backend
npm install
cp .env.example .env
npm run dev
```

### Contracts

```bash
cd tallyx-contracts/credit-ledger
stellar contract build
cargo test
```

## 🌐 Deployment

### Testnet

- **Contract Address:** `CDE5TJ25YJHIS5UI4GSXBZMNJVIFTANMJDM66FFORPO4NJBYK7ZGZGUZ`
- **Explorer:** [View on Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet/contract/CDE5TJ25YJHIS5UI4GSXBZMNJVIFTANMJDM66FFORPO4NJBYK7ZGZGUZ)
- **Backend API:** [https://tallyx-production.up.railway.app](https://tallyx-production.up.railway.app)

### Mainnet

- **Contract Address:** `coming soon`
- **Explorer:** `coming soon`

## 🎥 Demo

- 🔗 **Live Backend:** [https://tallyx-production.up.railway.app/health](https://tallyx-production.up.railway.app/health)
- 🎬 **Demo Video:** `coming soon`
- 🖼️ **Pitch Deck:** `coming soon`

## 🏗️ Architecture

```
tallyx-mobile         (Expo React Native)
  └── REST API calls
      └── tallyx-backend    (Express + PostgreSQL)
          └── Stellar SDK
              └── tallyx-contracts  (Soroban / Rust)
                  └── Stellar Testnet / Mainnet
```

### Security Model

- Stellar secret keys stay only on the mobile device (Expo SecureStore)
- Secret keys are never sent to the backend
- Only public keys are stored in PostgreSQL
- JWTs are used for session auth
- Passwords are bcrypt-hashed on the backend
- Backend secrets live in Railway environment variables

## 👨‍💻 Team

| Name | Role | GitHub |
|---|---|---|
| Jepoy | Full-stack + Blockchain | @Polqt |
| Carlos Valderrama | Contributor | @ascxiao |

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

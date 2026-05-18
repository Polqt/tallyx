# Tallyx

Blockchain-verified utang infrastructure for micro-retailers.

Tallyx helps sari-sari stores and small neighborhood retailers turn informal credit records into a clear receivables ledger with optional Stellar blockchain verification. The mobile app gives store owners a simple way to track customers, credits, payments, overdue balances, and verification history without making the experience feel like a crypto product.

## The Problem

Many micro-retailers still manage utang through notebooks, chat messages, or memory. That works for daily trust-based selling, but it creates real problems as the store grows:

- balances are easy to forget or dispute
- payment history is hard to prove
- receivables are not structured as financial data
- store owners cannot easily see overdue or active credit
- informal credit stays invisible to digital finance tools

Tallyx keeps the simplicity of the traditional utang system, then adds structure, visibility, and a verifiable transaction trail.

## The Solution

Tallyx is a mobile-first receivables ledger for store owners.

The store owner can:

- create an account
- set up a store profile
- generate a Stellar wallet
- add customers
- record credit given to customers
- record payments collected
- monitor total receivables and overdue balances
- view blockchain sync status and transaction references

Customers are not app users in the MVP. They exist as store-owned records with balances, QR identities, and transaction history.

## Why Blockchain

Tallyx does not use blockchain for trading, speculation, or DeFi complexity.

Blockchain is used as a verification layer:

```txt
Store ledger action
  -> backend persistence
  -> Soroban contract call
  -> Stellar transaction hash
  -> verifiable credit/payment record
```

The app still works if blockchain sync is unavailable. Credit and payment recording should remain fast, local-friendly, and reliable. Blockchain status is treated as metadata: `pending`, `syncing`, `synced`, or `failed`.

## How It Works

```txt
1. Store owner signs up
2. Store owner creates store profile
3. Mobile app generates a Stellar wallet
4. Secret key stays on the device
5. Public key is saved to the backend
6. Store owner adds customers
7. Store owner records credits and payments
8. Backend stores ledger data in PostgreSQL
9. Backend syncs selected actions to Soroban
10. App shows balances, history, and transaction references
```

## Demo Flow

For a hackathon demo, the clean story is:

1. Onboard as a sari-sari store owner.
2. Create a store profile.
3. Generate a wallet and show that only the public key is shared.
4. Add a customer.
5. Record a credit.
6. Record a partial or full payment.
7. Show dashboard totals updating.
8. Show blockchain sync status or a transaction hash when available.

## Core Features

| Feature | Description |
| --- | --- |
| Onboarding | Separate product onboarding before authentication |
| Authentication | Store owner sign-up and sign-in |
| Store setup | Store name, phone number, and wallet generation |
| Secure wallet | Stellar keypair generated on mobile; secret key stored in SecureStore |
| Dashboard | Total receivables, overdue amount, active customers, recent activity |
| Customers | Store-owned customer records with balances and QR identity |
| Credits | Amount owed to the store with due date, status, and sync metadata |
| Payments | Cash or USDC payment records with receipt and transaction reference support |
| Backend API | Persistence, authentication, and Stellar orchestration |
| Soroban contract | Minimal on-chain credit and payment verification |

## Architecture

```txt
tallyx-mobile
  Expo React Native app
  Zustand local state
  SecureStore for secrets
  AsyncStorage for safe cached data

tallyx-backend
  Express TypeScript API
  PostgreSQL persistence
  Drizzle ORM schema
  Zod validation
  Stellar orchestration

tallyx-contracts
  Rust Soroban contract
  credit creation
  payment recording
  balance lookup
```

High-level data flow:

```txt
Mobile App
  -> REST API
  -> PostgreSQL
  -> Stellar SDK
  -> Soroban Contract
  -> Transaction Hash
  -> Mobile App Sync Status
```

## Repository Structure

```txt
tallyx/
  tallyx-mobile/
    app/
    components/
    context/
    features/
    stores/
    utils/

  tallyx-backend/
    src/
      db/
      features/
      middleware/
      server.ts

  tallyx-contracts/
    credit-ledger/
      contracts/
        credit-ledger/
```

## Tech Stack

| Layer | Tools |
| --- | --- |
| Mobile | Expo SDK 55, React Native, Expo Router, TypeScript |
| Mobile state | Zustand, AsyncStorage, Expo SecureStore |
| Mobile UI | NativeWind, Lucide React Native, Expo modules |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Validation/Auth | Zod, JWT, bcrypt |
| Blockchain | Stellar SDK, Stellar CLI, Rust, Soroban SDK |

## Security Model

Wallet and authentication security are intentionally simple:

- Stellar secret keys stay only on the mobile device.
- Stellar secret keys are stored only in Expo SecureStore.
- Stellar secret keys are never sent to the backend.
- Stellar public keys can be stored in PostgreSQL.
- JWTs should be stored in SecureStore.
- Passwords are hashed on the backend.
- Backend secrets live in environment variables.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker
- Expo CLI through `npx expo`
- Stellar CLI for contract work
- Rust for Soroban contract tests

### Mobile

```bash
cd tallyx-mobile
npm install
npm run start
```

Useful checks:

```bash
npm run lint
npx tsc --noEmit
```

### Backend

```bash
cd tallyx-backend
npm install
cp .env.example .env
npm run dev
```

Run PostgreSQL from the root folder:

```bash
docker compose up postgres
```

### Contracts

```bash
cd tallyx-contracts/credit-ledger
stellar contract build
cargo test
```

## Environment Variables

Backend `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tallyx
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=7d

STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
CREDIT_CONTRACT_ID=your_contract_id_here
```

## Current MVP Status

| Area | Status |
| --- | --- |
| Mobile onboarding | Started |
| Auth screens and routing | Started |
| Store setup | Started |
| Wallet generation | Started |
| Dashboard shell | Started |
| Customers, credits, payments UI | Started |
| Backend modules | Started |
| PostgreSQL schema | Started |
| Soroban credit ledger | Started |
| Real Stellar backend sync | TODO |

## Roadmap

### Phase 1: Mobile UX

- Complete onboarding and auth flow.
- Complete store setup and wallet generation.
- Polish dashboard, customer, credit, and payment screens.
- Keep local state reliable before backend sync.

### Phase 2: Backend Persistence

- Connect mobile auth to backend auth.
- Persist store profiles, customers, credits, and payments.
- Fix backend TypeScript build issues.
- Add clean loading, empty, and error states.

### Phase 3: Blockchain Verification

- Deploy the Soroban credit-ledger contract.
- Replace mock Stellar transaction hashes with real contract calls.
- Save transaction hashes on credits and payments.
- Display sync status in the mobile app.

### Phase 4: Demo Polish

- Add realistic mock data.
- Add receipt and QR flows.
- Improve dashboard storytelling.
- Prepare a clean end-to-end demo path.

## GitHub Issues To Create

These are the next practical issues to add:

1. Mobile: Connect auth screens to real backend auth
2. Mobile: Persist store profile after store setup
3. Mobile: Connect customers to backend API
4. Mobile: Connect credits to backend API
5. Mobile: Connect payments to backend API
6. Backend: Fix TypeScript build and ledger service types
7. Backend: Implement Stellar contract calls
8. Contracts: Add store authorization to credit ledger
9. Contracts: Emit credit and payment events
10. DevOps: Document testnet/mainnet deployment flow

## Project Principles

- Mobile-first.
- Demo quality matters.
- Keep the architecture beginner-friendly.
- Do not overbuild blockchain features.
- Do not make customers authenticate in the MVP.
- Keep the app useful even when blockchain sync fails.
- Prefer readable code over clever abstractions.

## Product Positioning

Tallyx modernizes the sari-sari store credit notebook without removing the trust-based workflow that makes it work. It gives store owners a better ledger today and creates a path toward verifiable financial data tomorrow.

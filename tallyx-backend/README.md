# Tallyx Backend

Node.js API for the Tallyx mobile app. The backend handles authentication, PostgreSQL persistence, and Stellar/Soroban orchestration for credit and payment verification.

This service should stay simple for the hackathon MVP: REST endpoints, clear feature folders, Zod validation, Drizzle database access, and small service functions.

## Stack

- Node.js 20+
- Express 5
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod
- JWT
- Stellar SDK

## Responsibilities

- Create and authenticate store owner accounts.
- Store profile data and public Stellar wallet addresses.
- Manage customers for each store.
- Record credits and payments.
- Save blockchain transaction metadata.
- Call the Soroban credit-ledger contract when blockchain sync is enabled.

## Folder Structure

```txt
src/
  db/
    client.ts
    schema.ts
  features/
    auth/
    stores/
    customers/
    credits/
    payments/
    stellar/
  middleware/
  server.ts
```

Each feature folder keeps its router, validation schema, and service close together.

## Environment

Copy the example file:

```bash
cp .env.example .env
```

Required values:

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

Never commit real secrets.

## Setup

```bash
npm install
npm run dev
```

With Docker PostgreSQL from the repo root:

```bash
docker compose up postgres
```

## Scripts

```bash
npm run dev          # start API in watch mode
npm run build        # compile TypeScript
npm run start        # run compiled server
npm run db:generate  # generate Drizzle migrations
npm run db:migrate   # apply migrations
npm run db:studio    # open Drizzle Studio
```

## API Modules

| Module | Purpose |
| --- | --- |
| `auth` | sign up, sign in, password hashing, JWT creation |
| `stores` | store profile and Stellar public key |
| `customers` | customer records and lookup |
| `credits` | receivables and credit status |
| `payments` | payment history and balance updates |
| `stellar` | Soroban contract calls and transaction hashes |

## Data Model

Required MVP tables:

- `users`
- `stores`
- `customers`
- `credits`
- `payments`

The schema is intentionally small. Keep it readable and avoid audit systems, event buses, or unnecessary indexing until the MVP needs them.

## Stellar Integration

The backend currently contains placeholder Stellar service functions. The intended flow is:

1. Save the credit or payment in PostgreSQL.
2. Attempt a Soroban contract call.
3. Save the returned transaction hash.
4. Mark blockchain sync as failed or pending if the contract call is unavailable.

Basic ledger persistence should not depend on blockchain success during the MVP.

## Security Notes

- JWT secrets belong only in `.env`.
- Passwords must be hashed before storage.
- The mobile app must never send Stellar secret keys.
- The backend should store only Stellar public keys for store wallets.
- Do not log credentials or wallet secrets.

## Current TODO

- Fix backend TypeScript build issues in ledger services.
- Align amount/status types between schema and services.
- Replace mock Stellar transaction hashes with real Soroban calls.
- Add blockchain sync status fields where needed.

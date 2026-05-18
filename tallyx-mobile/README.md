# Tallyx Mobile

Expo React Native app for sari-sari store owners to manage customers, credits, payments, and blockchain verification status.

The mobile app is the primary product experience. It should feel complete even while backend and blockchain sync are still being connected.

## Stack

- Expo SDK 55
- React Native
- Expo Router
- TypeScript
- Zustand
- Expo SecureStore
- AsyncStorage
- NativeWind
- Lucide React Native
- Stellar Base SDK

## Product Flows

```txt
Onboarding
  -> Sign Up
  -> Sign In
  -> Store Name
  -> Phone Number
  -> Wallet Generation
  -> Dashboard
```

Protected tabs:

- Dashboard
- Customers
- Credits
- Payments
- Settings

## Folder Structure

```txt
app/
  (onboarding)/
  (auth)/
  (account)/
  (protected)/
components/
context/
features/
stores/
utils/
```

Feature-first folders are preferred for product logic:

```txt
features/
  auth/
  customers/
  credits/
  payments/
  wallet/
```

## Setup

```bash
npm install
npm run start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
npx tsc --noEmit
```

## Wallet Rules

The mobile app generates the store wallet because the secret key must stay on the user's device.

Allowed:

- Display the Stellar public key.
- Store the Stellar public key in the backend.
- Cache the Stellar public key locally.

Never:

- Send the Stellar secret key to the backend.
- Store the Stellar secret key in AsyncStorage.
- Log the Stellar secret key.
- Show the Stellar secret key permanently in the UI.

Current wallet storage:

- Secret key: Expo SecureStore
- Public key: Expo SecureStore and backend store profile

## State Management

Use Zustand for local app state:

- onboarding state
- account setup state
- store profile
- customers
- credits
- payments

Use AsyncStorage only for non-sensitive cached app data. Use SecureStore for JWTs and wallet secrets.

## Design Direction

The app should feel like a modern iOS fintech tool:

- clean spacing
- light surfaces
- soft shadows
- rounded cards
- calm green brand color
- realistic ledger hierarchy

Avoid crypto-heavy visuals, neon colors, dense dashboards, and complicated DeFi language.

## Current Screens

- Onboarding
- Sign up
- Sign in
- Forgot password shell
- Store setup
- Wallet generation
- Dashboard
- Customers
- Credits
- Payments
- Settings

## Backend Integration TODO

- Replace temporary auth state with real backend auth calls.
- Store JWT in SecureStore.
- Fetch and persist store profile through the backend.
- Connect customer CRUD to API.
- Connect credit creation/list to API.
- Connect payment creation/history to API.
- Surface blockchain sync status without blocking local ledger UX.

## Security Checklist

- JWT in SecureStore.
- Stellar secret key in SecureStore only.
- Stellar public key may be sent to backend.
- No wallet secret logs.
- No passwords in AsyncStorage.
- No hardcoded production secrets.

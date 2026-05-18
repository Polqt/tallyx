# Tallyx Contracts

Stellar Soroban contracts for verifying Tallyx credit and payment ledger activity.

The contracts are intentionally minimal. They are not a token system, DeFi protocol, DAO, or trading layer. Their job is to provide a simple on-chain proof trail for receivables and payments created by the Tallyx app.

## Current Contract

```txt
credit-ledger/
  contracts/
    credit-ledger/
      src/
        lib.rs
        storage.rs
        types.rs
        errors.rs
        test.rs
```

## Stack

- Rust
- Soroban SDK 26
- Stellar CLI 26

## Contract Responsibilities

The MVP contract supports:

- creating credit entries
- recording payments
- reading a credit entry
- reading a customer balance

Required public functions:

```rust
create_credit()
record_payment()
get_credit()
get_customer_balance()
```

## Setup

Install Rust and the Stellar CLI before working on contracts.

Check Stellar CLI:

```bash
stellar --version
```

Build from the contract workspace:

```bash
cd credit-ledger
stellar contract build
```

Run tests when Rust is available:

```bash
cd credit-ledger
cargo test
```

## Deployment Notes

The repository does not currently contain a deployed contract ID or a configured deployer wallet. Deployment should be done from a funded Stellar account using the Stellar CLI.

For backend integration, save the deployed contract ID in:

```env
CREDIT_CONTRACT_ID=
STELLAR_RPC_URL=
STELLAR_NETWORK=
```

## Security Rules

- Do not commit secret keys.
- Do not hardcode deployer accounts.
- Use Stellar CLI identities or environment variables for deployment.
- Keep contract authorization simple and testable.

## Current TODO

- Add authorization so only the expected store/lender can write credit activity.
- Add events for credit creation and payment recording.
- Document testnet/mainnet deploy and invoke commands.
- Connect deployed contract ID to the backend Stellar service.

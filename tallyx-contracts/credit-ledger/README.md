# Credit Ledger Contract

Soroban workspace for the Tallyx credit-ledger contract.

This contract stores the minimum on-chain data needed to verify utang records:

- credit ID
- store ID
- customer ID
- amount
- amount paid
- due date
- payment status
- customer running balance

UI-only data should stay off-chain in the mobile app and backend database.

## Contract API

```rust
create_credit(env, store_id, customer_id, amount, due_date) -> credit_id
record_payment(env, credit_id, amount) -> fully_paid
get_credit(env, credit_id) -> CreditEntry
get_customer_balance(env, customer_id) -> balance
```

## Storage

```txt
Credit(id)              -> CreditEntry
CreditCount             -> u64
CustomerBalance(id)     -> i128
```

## Status Values

```rust
Active
PartiallyPaid
FullyPaid
```

## Commands

```bash
stellar contract build
cargo test
cargo fmt --all
cargo clean
```

The included `Makefile` wraps the common commands:

```bash
make build
make test
make fmt
make clean
```

## MVP Notes

The contract currently keeps authorization and events as TODOs. For the hackathon, prioritize:

1. A clean contract API.
2. Passing tests.
3. A deployable WASM.
4. Backend calls that return a real transaction hash.

Avoid adding token logic, lending mechanics, DAO features, or complex metadata.

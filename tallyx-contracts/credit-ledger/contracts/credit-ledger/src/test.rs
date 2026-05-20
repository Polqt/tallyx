#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Events}, vec, Address, Env, IntoVal, Map, String, Symbol, Val, Vec};

fn setup(env: &Env) -> CreditLedgerClient<'_> {
    let contract_id = env.register(CreditLedger, ());
    CreditLedgerClient::new(env, &contract_id)
}

fn s(env: &Env, v: &str) -> String {
    String::from_str(env, v)
}

/// Create a credit with sensible defaults; returns the credit_id.
fn make_credit(client: &CreditLedgerClient, env: &Env, owner: &Address, customer_id: &str, amount: i128) -> u64 {
    client.create_credit(owner, &s(env, "store-001"), &s(env, customer_id), &amount, &9999)
}

// ── create_credit ──────────────────────────────────────────────────────────

#[test]
fn test_create_credit_returns_id() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-001", 500_000);
    assert_eq!(id, 1);
}

#[test]
fn test_ids_increment() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id1 = make_credit(&client, &env, &owner, "cust-001", 100);
    let id2 = make_credit(&client, &env, &owner, "cust-002", 200);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
}

#[test]
fn test_get_credit_returns_correct_entry() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = client.create_credit(
        &owner, &s(&env, "sari-sari"), &s(&env, "maria"), &1_000_000, &12345,
    );
    let entry = client.get_credit(&id);

    assert_eq!(entry.credit_id, id);
    assert_eq!(entry.amount, 1_000_000);
    assert_eq!(entry.amount_paid, 0);
    assert_eq!(entry.due_date, 12345);
    assert_eq!(entry.status, CreditStatus::Active);
}

#[test]
fn test_get_customer_balance_after_create() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    make_credit(&client, &env, &owner, "juan", 300_000);
    make_credit(&client, &env, &owner, "juan", 200_000);

    assert_eq!(client.get_customer_balance(&s(&env, "juan")), 500_000);
}

#[test]
fn test_unknown_customer_balance_is_zero() {
    let env = Env::default();
    let client = setup(&env);
    assert_eq!(client.get_customer_balance(&s(&env, "nobody")), 0);
}

#[test]
fn test_store_owner_stored_on_entry() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 500_000);
    let entry = client.get_credit(&id);
    assert_eq!(entry.store_owner, owner);
}

#[test]
fn test_events_emitted_on_create() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let credit_id = make_credit(&client, &env, &owner, "cust-007", 500_000);

    // #[contractevent] encodes data as a Map<Symbol, Val> sorted by key (alphabetical)
    // topic is struct name as snake_case Symbol
    let data: Map<Symbol, Val> = Map::from_array(&env, [
        (Symbol::new(&env, "amount"),      500_000_i128.into_val(&env)),
        (Symbol::new(&env, "credit_id"),   credit_id.into_val(&env)),
        (Symbol::new(&env, "customer_id"), s(&env, "cust-007").into_val(&env)),
        (Symbol::new(&env, "due_date"),    9999_u64.into_val(&env)),
        (Symbol::new(&env, "store_id"),    s(&env, "store-001").into_val(&env)),
    ]);

    let expected: Vec<(Address, Vec<Val>, Val)> = vec![&env,
        (
            client.address.clone(),
            vec![&env, Symbol::new(&env, "credit_created").into_val(&env)],
            data.into_val(&env),
        )
    ];
    assert_eq!(env.events().all(), expected);
}

#[test]
#[should_panic]
fn test_zero_amount_panics_on_create() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    make_credit(&client, &env, &owner, "cust-007", 0);
}

// ── record_payment ─────────────────────────────────────────────────────────

#[test]
fn test_partial_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 1_000_000);

    let fully_paid = client.record_payment(&id, &400_000);
    assert!(!fully_paid);

    let entry = client.get_credit(&id);
    assert_eq!(entry.amount_paid, 400_000);
    assert_eq!(entry.status, CreditStatus::PartiallyPaid);
}

#[test]
fn test_full_payment_returns_true() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 500_000);

    let fully_paid = client.record_payment(&id, &500_000);
    assert!(fully_paid);

    let entry = client.get_credit(&id);
    assert_eq!(entry.status, CreditStatus::FullyPaid);
    assert_eq!(entry.amount_paid, 500_000);
}

#[test]
fn test_payment_reduces_customer_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 1_000_000);

    client.record_payment(&id, &250_000);
    assert_eq!(client.get_customer_balance(&s(&env, "cust-007")), 750_000);
}

#[test]
fn test_multiple_partial_payments_accumulate() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 1_000_000);

    client.record_payment(&id, &200_000);
    client.record_payment(&id, &300_000);

    let entry = client.get_credit(&id);
    assert_eq!(entry.amount_paid, 500_000);
    assert_eq!(entry.status, CreditStatus::PartiallyPaid);
    assert_eq!(client.get_customer_balance(&s(&env, "cust-007")), 500_000);
}

#[test]
fn test_final_payment_marks_fully_paid() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 1_000_000);
    client.record_payment(&id, &600_000);
    let fully_paid = client.record_payment(&id, &400_000);

    assert!(fully_paid);
    assert_eq!(client.get_customer_balance(&s(&env, "cust-007")), 0);
}

#[test]
fn test_events_emitted_on_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let credit_id = make_credit(&client, &env, &owner, "cust-007", 500_000);
    client.record_payment(&credit_id, &500_000);

    let payment_data: Map<Symbol, Val> = Map::from_array(&env, [
        (Symbol::new(&env, "amount"),      500_000_i128.into_val(&env)),
        (Symbol::new(&env, "credit_id"),   credit_id.into_val(&env)),
        (Symbol::new(&env, "customer_id"), s(&env, "cust-007").into_val(&env)),
        (Symbol::new(&env, "fully_paid"),  true.into_val(&env)),
    ]);

    // Soroban test env only retains events from the most recent contract call
    let expected: Vec<(Address, Vec<Val>, Val)> = vec![&env,
        (
            client.address.clone(),
            vec![&env, Symbol::new(&env, "payment_recorded").into_val(&env)],
            payment_data.into_val(&env),
        ),
    ];
    assert_eq!(env.events().all(), expected);
}

#[test]
#[should_panic]
fn test_overpayment_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 100);
    client.record_payment(&id, &200);
}

#[test]
#[should_panic]
fn test_zero_payment_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);
    let owner = Address::generate(&env);

    let id = make_credit(&client, &env, &owner, "cust-007", 500_000);
    client.record_payment(&id, &0);
}

#[test]
#[should_panic]
fn test_payment_invalid_credit_id_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    client.record_payment(&999, &100);
}

#[test]
#[should_panic]
fn test_get_credit_not_found_panics() {
    let env = Env::default();
    let client = setup(&env);
    client.get_credit(&999);
}

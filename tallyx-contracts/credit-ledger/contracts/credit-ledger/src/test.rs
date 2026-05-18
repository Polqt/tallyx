#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

/// Helper: create a fresh environment with a deployed CreditLedger contract.
fn setup(env: &Env) -> CreditLedgerClient {
    let contract_id = env.register(CreditLedger, ());
    CreditLedgerClient::new(env, &contract_id)
}

/// Helper: make a Soroban String from a Rust &str.
fn s(env: &Env, v: &str) -> String {
    String::from_str(env, v)
}

#[test]
fn test_create_credit_returns_id() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &500_000, &9999);
    // First credit ever created should get ID 1.
    assert_eq!(id, 1);
}

#[test]
fn test_ids_increment() {
    let env = Env::default();
    let client = setup(&env);

    let id1 = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-001"), &100, &9999);
    let id2 = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-002"), &200, &9999);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
}

#[test]
fn test_get_credit_returns_correct_entry() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "sari-sari"), &s(&env, "maria"), &1_000_000, &12345);
    let entry = client.get_credit(&id);

    assert_eq!(entry.credit_id, id);
    assert_eq!(entry.amount, 1_000_000);
    assert_eq!(entry.amount_paid, 0);
    assert_eq!(entry.due_date, 12345);
}

#[test]
fn test_get_customer_balance_after_create() {
    let env = Env::default();
    let client = setup(&env);

    client.create_credit(&s(&env, "store-a"), &s(&env, "juan"), &300_000, &9999);
    client.create_credit(&s(&env, "store-b"), &s(&env, "juan"), &200_000, &9999);

    // Juan owes 500_000 total across both credits.
    assert_eq!(client.get_customer_balance(&s(&env, "juan")), 500_000);
}

#[test]
fn test_record_partial_payment() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &1_000_000, &9999);
    let fully_paid = client.record_payment(&id, &400_000);

    assert!(!fully_paid);

    let entry = client.get_credit(&id);
    assert_eq!(entry.amount_paid, 400_000);
}

#[test]
fn test_record_full_payment_returns_true() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &500_000, &9999);
    let fully_paid = client.record_payment(&id, &500_000);

    assert!(fully_paid);
}

#[test]
fn test_payment_reduces_customer_balance() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &1_000_000, &9999);
    client.record_payment(&id, &250_000);

    assert_eq!(client.get_customer_balance(&s(&env, "cust-007")), 750_000);
}

#[test]
fn test_unknown_customer_balance_is_zero() {
    let env = Env::default();
    let client = setup(&env);

    assert_eq!(client.get_customer_balance(&s(&env, "nobody")), 0);
}

#[test]
#[should_panic]
fn test_get_credit_not_found_panics() {
    let env = Env::default();
    let client = setup(&env);
    client.get_credit(&999);
}

#[test]
#[should_panic]
fn test_overpayment_panics() {
    let env = Env::default();
    let client = setup(&env);

    let id = client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &100, &9999);
    client.record_payment(&id, &200);
}

#[test]
#[should_panic]
fn test_zero_amount_panics() {
    let env = Env::default();
    let client = setup(&env);
    client.create_credit(&s(&env, "store-001"), &s(&env, "cust-007"), &0, &9999);
}

#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

fn setup(env: &Env) -> (CreditLedgerClient<'_>, Address) {
    let contract_id = env.register(CreditLedger, ());
    let client = CreditLedgerClient::new(env, &contract_id);
    (client, contract_id)
}

fn s(env: &Env, v: &str) -> String {
    String::from_str(env, v)
}

fn deploy_usdc(env: &Env, admin: &Address, recipient: &Address, amount: i128) -> Address {
    let token_id = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let admin_client = StellarAssetClient::new(env, &token_id);
    admin_client.mint(recipient, &amount);
    token_id
}

fn approve_usdc(env: &Env, usdc: &Address, spender: &Address, customer: &Address, amount: i128) {
    let token = TokenClient::new(env, usdc);
    let ledger_expiry = env.ledger().sequence() + 1000;
    token.approve(customer, spender, &amount, &ledger_expiry);
}

#[test]
fn test_create_credit_returns_id() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 0);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &500_000, &9999, &usdc,
    );
    assert_eq!(id, 1);
}

#[test]
fn test_ids_increment() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &c1, 0);

    let id1 = client.create_credit(&owner, &s(&env, "store-001"), &c1, &s(&env, "cust-001"), &100, &9999, &usdc);
    let id2 = client.create_credit(&owner, &s(&env, "store-001"), &c2, &s(&env, "cust-002"), &200, &9999, &usdc);
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
}

#[test]
fn test_get_credit_returns_correct_entry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 0);

    let id = client.create_credit(
        &owner, &s(&env, "sari-sari"), &customer_addr, &s(&env, "maria"),
        &1_000_000, &12345, &usdc,
    );
    let entry = client.get_credit(&id);

    assert_eq!(entry.credit_id, id);
    assert_eq!(entry.amount, 1_000_000);
    assert_eq!(entry.amount_paid, 0);
    assert_eq!(entry.due_date, 12345);
}

#[test]
fn test_get_customer_balance_after_create() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let juan = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &juan, 0);

    client.create_credit(&owner, &s(&env, "store-a"), &juan, &s(&env, "juan"), &300_000, &9999, &usdc);
    client.create_credit(&owner, &s(&env, "store-b"), &juan, &s(&env, "juan"), &200_000, &9999, &usdc);

    assert_eq!(client.get_customer_balance(&s(&env, "juan")), 500_000);
}

#[test]
fn test_record_partial_payment_with_usdc() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, contract_id) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 1_000_000);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &1_000_000, &9999, &usdc,
    );

    // Customer approves the contract to spend their USDC
    approve_usdc(&env, &usdc, &contract_id, &customer_addr, 1_000_000);

    let fully_paid = client.record_payment(&id, &400_000);
    assert!(!fully_paid);

    let entry = client.get_credit(&id);
    assert_eq!(entry.amount_paid, 400_000);

    // USDC moved: customer lost 400k, store owner gained 400k
    let token = TokenClient::new(&env, &usdc);
    assert_eq!(token.balance(&customer_addr), 600_000);
    assert_eq!(token.balance(&owner), 400_000);
}

#[test]
fn test_record_full_payment_returns_true() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, contract_id) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 500_000);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &500_000, &9999, &usdc,
    );

    approve_usdc(&env, &usdc, &contract_id, &customer_addr, 500_000);

    let fully_paid = client.record_payment(&id, &500_000);
    assert!(fully_paid);
}

#[test]
fn test_payment_reduces_customer_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, contract_id) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 1_000_000);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &1_000_000, &9999, &usdc,
    );

    approve_usdc(&env, &usdc, &contract_id, &customer_addr, 1_000_000);

    client.record_payment(&id, &250_000);
    assert_eq!(client.get_customer_balance(&s(&env, "cust-007")), 750_000);
}

#[test]
fn test_unknown_customer_balance_is_zero() {
    let env = Env::default();
    let (client, _) = setup(&env);
    assert_eq!(client.get_customer_balance(&s(&env, "nobody")), 0);
}

#[test]
#[should_panic]
fn test_get_credit_not_found_panics() {
    let env = Env::default();
    let (client, _) = setup(&env);
    client.get_credit(&999);
}

#[test]
#[should_panic]
fn test_overpayment_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, contract_id) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 1_000_000);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &100, &9999, &usdc,
    );
    approve_usdc(&env, &usdc, &contract_id, &customer_addr, 1_000_000);
    client.record_payment(&id, &200);
}

#[test]
#[should_panic]
fn test_zero_amount_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 0);

    client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &0, &9999, &usdc,
    );
}

#[test]
fn test_only_store_owner_stored_on_entry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 0);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &500_000, &9999, &usdc,
    );
    let entry = client.get_credit(&id);
    assert_eq!(entry.store_owner, owner);
}

#[test]
fn test_events_emitted_on_create() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 0);

    client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &500_000, &9999, &usdc,
    );

    assert!(!env.events().all().events().is_empty());
}

#[test]
fn test_events_emitted_on_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, contract_id) = setup(&env);
    let owner = Address::generate(&env);
    let customer_addr = Address::generate(&env);
    let usdc_admin = Address::generate(&env);
    let usdc = deploy_usdc(&env, &usdc_admin, &customer_addr, 500_000);

    let id = client.create_credit(
        &owner, &s(&env, "store-001"), &customer_addr, &s(&env, "cust-007"),
        &500_000, &9999, &usdc,
    );
    approve_usdc(&env, &usdc, &contract_id, &customer_addr, 500_000);
    client.record_payment(&id, &500_000);

    assert!(!env.events().all().events().is_empty());
}

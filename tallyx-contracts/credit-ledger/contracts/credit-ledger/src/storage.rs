use soroban_sdk::{Env, String};

use crate::types::{CreditEntry, DataKey};

// Credit counter — used to assign unique IDs
pub fn read_credit_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::CreditCount)
        .unwrap_or(0u64)
}

pub fn write_credit_count(env: &Env, count: u64) {
    env.storage()
        .instance()
        .set(&DataKey::CreditCount, &count);
}


// Individual credit entries
pub fn read_credit(env: &Env, credit_id: u64) -> Option<CreditEntry> {
    env.storage()
        .persistent()
        .get(&DataKey::Credit(credit_id))
}

pub fn write_credit(env: &Env, entry: &CreditEntry) {
    env.storage()
        .persistent()
        .set(&DataKey::Credit(entry.credit_id), entry);
}

// Per-customer running balance
pub fn read_customer_balance(env: &Env, customer_id: &String) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::CustomerBalance(customer_id.clone()))
        .unwrap_or(0i128)
}

pub fn write_customer_balance(env: &Env, customer_id: &String, balance: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::CustomerBalance(customer_id.clone()), &balance);
}

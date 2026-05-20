#![no_std]

mod errors;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{
    contract, contractevent, contractimpl, panic_with_error, token, Address, Env, String,
};
use storage::{
    read_credit, read_credit_count, read_customer_balance, write_credit, write_credit_count,
    write_customer_balance,
};
use types::{CreditEntry, CreditStatus};

#[contractevent]
pub struct CreditCreated {
    pub credit_id: u64,
    pub store_id: String,
    pub customer_id: String,
    pub amount: i128,
    pub due_date: u64,
}

#[contractevent]
pub struct PaymentRecorded {
    pub credit_id: u64,
    pub customer_id: String,
    pub amount: i128,
    pub fully_paid: bool,
}

#[contract]
pub struct CreditLedger;

#[contractimpl]
impl CreditLedger {
    /// Record a new credit (utang) extended by a store to a customer.
    ///
    /// The `store_owner` must sign the transaction.
    /// `customer_address` is the customer's Stellar wallet — stored so USDC
    /// can be pulled from them when they repay.
    /// `usdc_token` is the USDC token contract address on this network.
    ///
    /// Returns the auto-generated credit_id for this entry.
    pub fn create_credit(
        env: Env,
        store_owner: Address,
        store_id: String,
        customer_address: Address,
        customer_id: String,
        amount: i128,
        due_date: u64,
        usdc_token: Address,
    ) -> u64 {
        store_owner.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let credit_id = read_credit_count(&env) + 1;
        write_credit_count(&env, credit_id);

        let entry = CreditEntry {
            credit_id,
            store_id: store_id.clone(),
            store_owner,
            customer_address,
            customer_id: customer_id.clone(),
            amount,
            amount_paid: 0,
            due_date,
            status: CreditStatus::Active,
            usdc_token,
        };

        write_credit(&env, &entry);

        let prev_balance = read_customer_balance(&env, &customer_id);
        write_customer_balance(&env, &customer_id, prev_balance + amount);

        CreditCreated {
            credit_id,
            store_id,
            customer_id,
            amount,
            due_date,
        }
        .publish(&env);

        credit_id
    }

    /// Record a payment against an existing credit.
    ///
    /// The original `store_owner` who created the credit must sign.
    /// This triggers a USDC transfer of `amount` stroops from the customer's
    /// wallet to the store owner's wallet. The customer must have pre-approved
    /// this contract to spend their USDC (via the token's `approve` call).
    ///
    /// Returns `true` when the credit is fully settled, `false` otherwise.
    pub fn record_payment(env: Env, credit_id: u64, amount: i128) -> bool {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let mut entry = read_credit(&env, credit_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::CreditNotFound));

        // Require the original store owner to authorize each payment.
        entry.store_owner.require_auth();

        let remaining = entry.amount - entry.amount_paid;
        if amount > remaining {
            panic_with_error!(&env, Error::Overpayment);
        }

        // Transfer USDC from customer → store owner.
        // The customer must have called `approve` on the USDC token contract
        // granting this contract an allowance >= amount.
        let usdc = token::Client::new(&env, &entry.usdc_token);
        usdc.transfer_from(
            &env.current_contract_address(),
            &entry.customer_address,
            &entry.store_owner,
            &amount,
        );

        entry.amount_paid += amount;

        entry.status = if entry.amount_paid == entry.amount {
            CreditStatus::FullyPaid
        } else {
            CreditStatus::PartiallyPaid
        };

        write_credit(&env, &entry);

        let prev_balance = read_customer_balance(&env, &entry.customer_id);
        write_customer_balance(&env, &entry.customer_id, prev_balance - amount);

        let fully_paid = entry.status == CreditStatus::FullyPaid;

        PaymentRecorded {
            credit_id,
            customer_id: entry.customer_id,
            amount,
            fully_paid,
        }
        .publish(&env);

        fully_paid
    }

    /// Fetch a single credit entry by its ID.
    pub fn get_credit(env: Env, credit_id: u64) -> CreditEntry {
        read_credit(&env, credit_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::CreditNotFound))
    }

    /// Get the total outstanding balance for a customer across all their credits.
    ///
    /// Returns 0 if the customer has no credits on record.
    pub fn get_customer_balance(env: Env, customer_id: String) -> i128 {
        read_customer_balance(&env, &customer_id)
    }
}

mod test;

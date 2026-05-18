#![no_std]

mod errors;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, panic_with_error, Env, String};
use storage::{
    read_credit, read_credit_count, read_customer_balance, write_credit, write_credit_count,
    write_customer_balance,
};
use types::{CreditEntry, CreditStatus};

#[contract]
pub struct CreditLedger;

#[contractimpl]
impl CreditLedger {
    /// Record a new credit (utang) extended by a store to a customer.
    ///
    /// Returns the auto-generated credit_id for this entry.
    ///
    /// # Arguments
    /// * `store_id`    - Identifier for the store/lender (e.g. "store-001")
    /// * `customer_id` - Identifier for the customer/borrower (e.g. "cust-007")
    /// * `amount`      - Amount owed in stroops (i128 to allow large values)
    /// * `due_date`    - Unix timestamp when the credit is due
    pub fn create_credit(
        env: Env,
        store_id: String,
        customer_id: String,
        amount: i128,
        due_date: u64,
    ) -> u64 {
        // TODO(auth): require store_id owner to sign this transaction

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        // Assign the next available ID (starts at 1).
        let credit_id = read_credit_count(&env) + 1;
        write_credit_count(&env, credit_id);

        let entry = CreditEntry {
            credit_id,
            store_id,
            customer_id: customer_id.clone(),
            amount,
            amount_paid: 0,
            due_date,
            status: CreditStatus::Active,
        };

        write_credit(&env, &entry);

        // Add this amount to the customer's running balance.
        let prev_balance = read_customer_balance(&env, &customer_id);
        write_customer_balance(&env, &customer_id, prev_balance + amount);

        // TODO(events): emit CreditCreated event for off-chain indexers

        credit_id
    }

    /// Record a payment against an existing credit.
    ///
    /// Returns `true` when the credit is fully settled, `false` otherwise.
    ///
    /// # Arguments
    /// * `credit_id` - The ID returned by `create_credit`
    /// * `amount`    - Payment amount in stroops (must be > 0)
    pub fn record_payment(env: Env, credit_id: u64, amount: i128) -> bool {
        // TODO(auth): require store_id owner or a verified lender to sign

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let mut entry = read_credit(&env, credit_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::CreditNotFound));

        let remaining = entry.amount - entry.amount_paid;
        if amount > remaining {
            panic_with_error!(&env, Error::Overpayment);
        }

        entry.amount_paid += amount;

        // Update status based on how much has been repaid.
        entry.status = if entry.amount_paid == entry.amount {
            CreditStatus::FullyPaid
        } else {
            CreditStatus::PartiallyPaid
        };

        write_credit(&env, &entry);

        // Reduce the customer's running balance by the payment amount.
        let prev_balance = read_customer_balance(&env, &entry.customer_id);
        write_customer_balance(&env, &entry.customer_id, prev_balance - amount);

        // TODO(events): emit PaymentRecorded event for off-chain indexers
        // TODO(usdc): trigger USDC transfer from customer to store here

        entry.status == CreditStatus::FullyPaid
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
        // TODO(lender): restrict to verified lenders or the customer themselves
        read_customer_balance(&env, &customer_id)
    }
}

mod test;

use soroban_sdk::{contracttype, Address, String};

/// Status of a credit entry.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CreditStatus {
    Active,
    PartiallyPaid,
    FullyPaid,
}

/// A single credit (utang) record stored on-chain.
#[contracttype]
#[derive(Clone, Debug)]
pub struct CreditEntry {
    pub credit_id: u64,
    /// The sari-sari store or lender that extended the credit.
    pub store_id: String,
    /// The Stellar address of the store owner who created this credit.
    pub store_owner: Address,
    /// The customer's Stellar address (used for USDC transfers on payment).
    pub customer_address: Address,
    /// The customer who owes the amount (off-chain DB ID, for indexing).
    pub customer_id: String,
    /// Original amount owed, in stroops (1 XLM = 10_000_000 stroops).
    pub amount: i128,
    /// How much has been paid back so far.
    pub amount_paid: i128,
    /// Unix timestamp (seconds) when this credit is due.
    pub due_date: u64,
    pub status: CreditStatus,
    /// The USDC token contract address used for payment settlement.
    pub usdc_token: Address,
}

/// Storage key enum — each variant maps to a distinct slot in contract storage.
#[contracttype]
pub enum DataKey {
    /// Maps credit_id -> CreditEntry.
    Credit(u64),
    /// Tracks how many credits have been created (used to generate IDs).
    CreditCount,
    /// Maps customer_id -> total outstanding balance across all their credits.
    CustomerBalance(String),
}

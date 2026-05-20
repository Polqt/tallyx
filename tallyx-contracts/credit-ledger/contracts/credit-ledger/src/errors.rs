use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    /// No credit entry found for the given credit_id.
    CreditNotFound = 1,
    /// Payment amount must be greater than zero.
    InvalidAmount = 2,
    /// Payment would exceed the remaining balance owed.
    Overpayment = 3,
}

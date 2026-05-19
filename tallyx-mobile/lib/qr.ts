export const CUSTOMER_QR_TYPE = 'tallyx_customer_identity';
export const CUSTOMER_QR_VERSION = 1;

// QR codes contain only customer identity metadata.
// Never include private keys, Stellar secret keys, passwords, or auth tokens in QR payloads.
// This payload is safe to print or share because it only identifies a customer record.
export type CustomerQRData = {
  type: typeof CUSTOMER_QR_TYPE;
  version: typeof CUSTOMER_QR_VERSION;
  customerId: string;
  storeId: string;
};

type CreateCustomerQRDataInput = {
  customerId: string;
  storeId: string;
};

export function createCustomerQRData(input: CreateCustomerQRDataInput) {
  return JSON.stringify({
    type: CUSTOMER_QR_TYPE,
    version: CUSTOMER_QR_VERSION,
    customerId: input.customerId,
    storeId: input.storeId,
  });
}

export function parseCustomerQRData(rawValue: string): CustomerQRData | null {
  try {
    const value = JSON.parse(rawValue) as Partial<CustomerQRData>;

    if (value.type !== CUSTOMER_QR_TYPE) return null;
    if (value.version !== CUSTOMER_QR_VERSION) return null;
    if (typeof value.customerId !== 'string' || value.customerId.length === 0) return null;
    if (typeof value.storeId !== 'string' || value.storeId.length === 0) return null;

    return {
      type: CUSTOMER_QR_TYPE,
      version: CUSTOMER_QR_VERSION,
      customerId: value.customerId,
      storeId: value.storeId,
    };
  } catch {
    return null;
  }
}

export function isTallyxCustomerQR(rawValue: string) {
  return parseCustomerQRData(rawValue) !== null;
}

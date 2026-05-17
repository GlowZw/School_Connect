export type PaymentProviderKey =
  | 'mock'
  | 'paynow'
  | 'stripe'
  | 'paypal'
  | 'ecocash'
  | 'onemoney'
  | 'bank';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'overdue';

export type PaymentIntentPayload = {
  schoolId: string;
  parentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  studentId: string;
};

export type PaymentIntentResult = {
  provider: PaymentProviderKey;
  clientSecret: string;
  checkoutUrl?: string;
  reference: string;
};

export type PaymentVerificationResult = {
  transactionId: string;
  status: PaymentStatus;
  verifiedAt: string;
};

export interface PaymentProvider {
  createIntent: (payload: PaymentIntentPayload) => Promise<PaymentIntentResult>;
  verifyTransaction: (reference: string) => Promise<PaymentVerificationResult>;
}

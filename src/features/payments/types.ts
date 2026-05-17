import type { Timestamp } from 'firebase/firestore';

import type { PaymentProviderKey, PaymentStatus } from '@/services/payments/types';

export type FeeInvoice = {
  id: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  term: string;
  title: string;
  amount: number;
  outstandingAmount: number;
  currency: string;
  dueDate: Timestamp | Date;
  status: PaymentStatus;
};

export type PaymentTransaction = {
  id: string;
  schoolId: string;
  invoiceId: string;
  parentId: string;
  amount: number;
  currency: string;
  provider: PaymentProviderKey;
  status: PaymentStatus;
  receiptUrl?: string;
  createdAt: Timestamp | Date;
  reference: string;
};

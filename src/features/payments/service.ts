import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

import { logAnalyticsEvent } from '@/services/firebase/analytics';
import { firestore } from '@/services/firebase/firestore';
import { getPaymentProvider } from '@/services/payments/registry';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { FeeInvoice, PaymentTransaction } from '@/features/payments/types';
import type { PaymentIntentPayload, PaymentProviderKey } from '@/services/payments/types';

export async function listInvoicesForParent(schoolId: string, parentId: string) {
  const invoiceQuery = query(
    collection(firestore, schoolCollectionPath(schoolId, 'fee_invoices')),
    where('parentId', '==', parentId),
    orderBy('dueDate', 'asc'),
  );
  const snapshot = await getDocs(invoiceQuery);

  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<FeeInvoice, 'id'>) }));
}

export async function listTransactionsForParent(schoolId: string, parentId: string) {
  const transactionQuery = query(
    collection(firestore, schoolCollectionPath(schoolId, 'payment_transactions')),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(transactionQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<PaymentTransaction, 'id'>),
  }));
}

export async function createPaymentIntent(
  provider: PaymentProviderKey,
  payload: PaymentIntentPayload,
) {
  const result = await getPaymentProvider(provider).createIntent(payload);

  await logAnalyticsEvent('payment_intent_created', {
    schoolId: payload.schoolId,
    amount: payload.amount,
    provider,
  });

  return result;
}

export async function verifyPayment(provider: PaymentProviderKey, reference: string) {
  const result = await getPaymentProvider(provider).verifyTransaction(reference);

  await logAnalyticsEvent('payment_verification_requested', {
    provider,
    status: result.status,
  });

  return result;
}

export const sampleInvoices: FeeInvoice[] = [
  {
    id: 'invoice-1',
    schoolId: 'school-demo',
    studentId: 'student-1',
    parentId: 'parent-1',
    term: 'Term 2',
    title: 'Tuition Fee - Term 2',
    amount: 1200,
    outstandingAmount: 350,
    currency: 'USD',
    dueDate: new Date('2026-05-31'),
    status: 'pending',
  },
  {
    id: 'invoice-2',
    schoolId: 'school-demo',
    studentId: 'student-1',
    parentId: 'parent-1',
    term: 'Transport',
    title: 'Transport Fee',
    amount: 300,
    outstandingAmount: 0,
    currency: 'USD',
    dueDate: new Date('2026-05-10'),
    status: 'paid',
  },
];

export const sampleTransactions: PaymentTransaction[] = [
  {
    id: 'txn-1',
    schoolId: 'school-demo',
    invoiceId: 'invoice-2',
    parentId: 'parent-1',
    amount: 300,
    currency: 'USD',
    provider: 'mock',
    status: 'paid',
    createdAt: new Date('2026-05-09'),
    reference: 'SCH-20260509-01',
    receiptUrl: 'https://example.com/receipt-1.pdf',
  },
  {
    id: 'txn-2',
    schoolId: 'school-demo',
    invoiceId: 'invoice-1',
    parentId: 'parent-1',
    amount: 850,
    currency: 'USD',
    provider: 'mock',
    status: 'pending',
    createdAt: new Date('2026-05-15'),
    reference: 'SCH-20260515-01',
  },
];

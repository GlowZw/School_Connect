import { StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/ui/metric-card';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { FeeInvoice, PaymentTransaction } from '@/features/payments/types';
import { theme } from '@/theme';

type PaymentsOverviewProps = {
  invoices: FeeInvoice[];
  transactions: PaymentTransaction[];
};

export function PaymentsOverview({ invoices, transactions }: PaymentsOverviewProps) {
  const totalPaid = transactions
    .filter((transaction) => transaction.status === 'paid')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const pending = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

  return (
    <View style={styles.wrapper}>
      <SectionHeading
        title="Fee Management"
        subtitle="Balances, receipts, server-verified transactions, and provider abstraction."
      />
      <View style={styles.metrics}>
        <MetricCard label="Total Paid" value={`$${totalPaid}`} />
        <MetricCard label="Outstanding" value={`$${pending}`} meta="Secure verification enabled" />
      </View>
      {transactions.map((transaction) => (
        <ListRow
          key={transaction.id}
          title={`${transaction.reference} • ${transaction.provider.toUpperCase()}`}
          subtitle={`$${transaction.amount} ${transaction.currency}`}
          badge={{
            label: transaction.status,
            tone:
              transaction.status === 'paid'
                ? 'success'
                : transaction.status === 'overdue'
                  ? 'danger'
                  : 'warning',
          }}
          meta={formatDate(transaction.createdAt)}
        />
      ))}
    </View>
  );
}

function formatDate(value: PaymentTransaction['createdAt']) {
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  metrics: {
    gap: theme.spacing.md,
  },
});

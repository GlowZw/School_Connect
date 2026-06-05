import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/ui/metric-card';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { FeeInvoice, PaymentTransaction } from '@/features/payments/types';
import { theme } from '@/theme';

type PaymentsOverviewProps = {
  invoices: FeeInvoice[];
  transactions: PaymentTransaction[];
  requireBalanceReveal?: boolean;
};

export function PaymentsOverview({
  invoices,
  transactions,
  requireBalanceReveal = false,
}: PaymentsOverviewProps) {
  const [showBalance, setShowBalance] = useState(false);
  const totalPaid = transactions
    .filter((transaction) => transaction.status === 'paid')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const pending = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const outstandingBalance =
    requireBalanceReveal && !showBalance ? '********' : formatCurrency(pending);

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => !prev);
  };

  return (
    <View style={styles.wrapper}>
      <SectionHeading
        title="Fee Management"
        subtitle="Balances, receipts, server-verified transactions, and provider abstraction."
      />
      <View style={styles.metrics}>
        <MetricCard label="Total Paid" value={formatCurrency(totalPaid)} />
        <MetricCard
          label={requireBalanceReveal ? 'Outstanding Balance' : 'Outstanding'}
          value={outstandingBalance}
          meta="Secure verification enabled"
        />
        {requireBalanceReveal ? (
          <Pressable
            accessibilityLabel="Toggle fees balance visibility"
            onPress={toggleBalanceVisibility}
            style={({ pressed }) => [
              styles.toggleButton,
              pressed ? styles.toggleButtonPressed : null,
            ]}
          >
            <Text style={styles.toggleButtonLabel}>
              {showBalance ? 'Hide Balance' : 'Click to View'}
            </Text>
          </Pressable>
        ) : null}
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

function formatCurrency(value: number) {
  return `$${value}`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  metrics: {
    gap: theme.spacing.md,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
  },
  toggleButtonPressed: {
    opacity: 0.85,
  },
  toggleButtonLabel: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});

import { Screen } from '@/components/ui/screen';
import { PaymentsOverview } from '@/features/payments/components/payments-overview';
import { sampleInvoices, sampleTransactions } from '@/features/payments/service';

export default function ParentPaymentsScreen() {
  return (
    <Screen scrollable>
      <PaymentsOverview
        invoices={sampleInvoices}
        transactions={sampleTransactions}
        requireBalanceReveal
      />
    </Screen>
  );
}

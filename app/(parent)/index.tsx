import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionTile } from '@/components/ui/action-tile';
import { MetricCard } from '@/components/ui/metric-card';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { SectionHeading } from '@/components/ui/section-heading';
import { sampleConversations } from '@/features/messaging/service';
import { sampleInvoices } from '@/features/payments/service';
import { theme } from '@/theme';

export default function ParentDashboardScreen() {
  const outstanding = sampleInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Parent Portal"
        title="Daily school engagement"
        description="Track payments, messages, awards, sports, and meal planning from one tenant-safe workspace."
      />
      <View style={styles.metrics}>
        <MetricCard label="Unread Messages" value={`${sampleConversations[0]?.unreadCount ?? 0}`} />
        <MetricCard
          label="Outstanding Fees"
          value={`$${outstanding}`}
          meta="Payment verification is server-side"
        />
      </View>
      <SectionHeading
        title="Quick Access"
        subtitle="Phase 2 modules aligned to the parent experience designs."
      />
      <View style={styles.tiles}>
        <ActionTile
          title="Messages"
          description="Direct chats, class groups, and read receipts."
          onPress={() => router.push('/shared/messages' as never)}
        />
        <ActionTile
          title="Payments"
          description="Balances, payment history, and secure confirmations."
          accent={theme.colors.success}
          onPress={() => router.push('/(parent)/payments')}
        />
        <ActionTile
          title="Sports and Culture"
          description="See participation, fixtures, galleries, and events."
          accent={theme.colors.accent}
          onPress={() => router.push('/(parent)/activities')}
        />
        <ActionTile
          title="Awards"
          description="Recognition notifications and certificate downloads."
          accent={theme.colors.warning}
          onPress={() => router.push('/(parent)/awards')}
        />
        <ActionTile
          title="Lunch Menu"
          description="Weekly schedules with dietary and allergy notices."
          accent={theme.colors.secondary}
          onPress={() => router.push('/(parent)/lunch')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: theme.spacing.md,
  },
  tiles: {
    gap: theme.spacing.md,
  },
});

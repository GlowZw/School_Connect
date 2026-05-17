import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/ui/metric-card';
import { ModuleDashboard } from '@/components/ui/module-dashboard';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { roleNavigationItems } from '@/constants/navigation';
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
      <ModuleDashboard
        modules={roleNavigationItems.parent.filter((item) => item.label !== 'Dashboard')}
        onNavigate={(href) => router.push(href as never)}
        subtitle="Home dashboard shortcuts that match the sidebar menu."
        title="Quick Access"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: theme.spacing.md,
  },
});

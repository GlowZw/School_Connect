import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/ui/metric-card';
import { ModuleDashboard } from '@/components/ui/module-dashboard';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { roleNavigationItems } from '@/constants/navigation';
import { sampleAwards } from '@/features/awards/service';
import { sampleConversations } from '@/features/messaging/service';
import { sampleInvoices } from '@/features/payments/service';
import { theme } from '@/theme';

export default function AdminDashboardScreen() {
  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Admin Portal"
        title="Oversee Phase 2 operations"
        description="Broadcast school communication, manage payments, publish recognition, and control food and activity operations."
      />
      <View style={styles.metrics}>
        <MetricCard label="Live Conversations" value={`${sampleConversations.length}`} />
        <MetricCard label="Open Invoices" value={`${sampleInvoices.length}`} />
        <MetricCard
          label="Awards Published"
          value={`${sampleAwards.length}`}
          meta="Permission-based controls enabled"
        />
      </View>
      <ModuleDashboard
        modules={roleNavigationItems.admin.filter((item) => item.label !== 'Dashboard')}
        onNavigate={(href) => router.push(href as never)}
        subtitle="Home dashboard shortcuts that mirror the sidebar menu."
        title="Administration"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: theme.spacing.md,
  },
});

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionTile } from '@/components/ui/action-tile';
import { MetricCard } from '@/components/ui/metric-card';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { SectionHeading } from '@/components/ui/section-heading';
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
      <SectionHeading
        title="Administration"
        subtitle="Tenant-safe management surfaces for School Connect Phase 2."
      />
      <View style={styles.tiles}>
        <ActionTile
          title="Messages"
          description="Broadcast announcements and monitor conversation activity."
          onPress={() => router.push('/shared/messages' as never)}
        />
        <ActionTile
          title="Payments"
          description="Monitor fee structures, reports, and verification flows."
          accent={theme.colors.success}
          onPress={() => router.push('/(admin)/payments')}
        />
        <ActionTile
          title="Sports and Culture"
          description="Manage events, media, and participation."
          accent={theme.colors.accent}
          onPress={() => router.push('/(admin)/activities')}
        />
        <ActionTile
          title="Awards"
          description="Issue recognition, categories, and certificates."
          accent={theme.colors.warning}
          onPress={() => router.push('/(admin)/awards')}
        />
        <ActionTile
          title="Lunch Menu"
          description="Publish menu schedules and dietary notices."
          accent={theme.colors.secondary}
          onPress={() => router.push('/(admin)/lunch')}
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

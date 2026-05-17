import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MetricCard } from '@/components/ui/metric-card';
import { ModuleDashboard } from '@/components/ui/module-dashboard';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { roleNavigationItems } from '@/constants/navigation';
import { sampleConversations } from '@/features/messaging/service';
import { sampleActivityEvents, sampleTeams } from '@/features/sports/service';
import { theme } from '@/theme';

export default function TeacherDashboardScreen() {
  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Teacher Portal"
        title="Manage communication and activities"
        description="Coordinate parent messaging, sports and culture updates, awards, and operational alerts."
      />
      <View style={styles.metrics}>
        <MetricCard label="Active Threads" value={`${sampleConversations.length}`} />
        <MetricCard
          label="Upcoming Activities"
          value={`${sampleActivityEvents.length}`}
          meta={`${sampleTeams.length} managed groups`}
        />
      </View>
      <ModuleDashboard
        modules={roleNavigationItems.teacher.filter((item) => item.label !== 'Dashboard')}
        onNavigate={(href) => router.push(href as never)}
        subtitle="Dashboard icons for the same modules available in the sidebar."
        title="Teaching Workflow"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: theme.spacing.md,
  },
});

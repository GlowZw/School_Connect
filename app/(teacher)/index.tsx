import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionTile } from '@/components/ui/action-tile';
import { MetricCard } from '@/components/ui/metric-card';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { SectionHeading } from '@/components/ui/section-heading';
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
      <SectionHeading
        title="Teaching Workflow"
        subtitle="Operational tools built around realtime communication and engagement."
      />
      <View style={styles.tiles}>
        <ActionTile
          title="Messages"
          description="Reply to parents, use group threads, and monitor unread activity."
          onPress={() => router.push('/shared/messages' as never)}
        />
        <ActionTile
          title="Sports and Culture"
          description="Manage fixtures, results, galleries, and club participation."
          accent={theme.colors.accent}
          onPress={() => router.push('/(teacher)/activities')}
        />
        <ActionTile
          title="Awards"
          description="Prepare recognition updates and publish achievements."
          accent={theme.colors.warning}
          onPress={() => router.push('/(teacher)/awards')}
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

import { View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { ActivityEvent, Team } from '@/features/sports/types';
import { theme } from '@/theme';

type ActivityOverviewProps = {
  teams: Team[];
  events: ActivityEvent[];
};

export function ActivityOverview({ teams, events }: ActivityOverviewProps) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeading
        title="Sports and Culture"
        subtitle="Teams, fixtures, galleries, participation, and activity announcements."
      />
      {teams.map((team) => (
        <ListRow
          key={team.id}
          title={team.name}
          subtitle={`${team.coachName} • ${team.memberCount} members`}
          badge={{ label: team.category, tone: team.category === 'sports' ? 'accent' : 'warning' }}
        />
      ))}
      {events.map((event) => (
        <ListRow
          key={event.id}
          title={event.title}
          subtitle={`${event.subtitle} • ${event.venue}`}
          meta={formatDate(event.scheduledAt)}
          badge={{ label: event.kind, tone: event.kind === 'sports' ? 'accent' : 'warning' }}
        />
      ))}
      <Chip label="Media upload validation enabled" tone="success" />
    </View>
  );
}

function formatDate(value: ActivityEvent['scheduledAt']) {
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleString();
}

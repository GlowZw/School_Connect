import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { formatLocalDate, getCalendarEventDateKey } from '@/features/calendar/service';
import { useCalendarEvents } from '@/features/calendar/use-calendar-events';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';

export default function TeacherAnnouncementsScreen() {
  const schoolId = useAuthStore((state) => state.profile?.schoolId);
  const { data: events = [] } = useCalendarEvents(schoolId);
  const upcomingEvents = events
    .filter((event) => getCalendarEventDateKey(event) >= formatLocalDate(new Date()))
    .slice(0, 5);

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Teacher Portal</Text>
        <Text style={styles.title}>Announcements</Text>
      </View>

      {upcomingEvents.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No calendar-driven announcements available.</Text>
        </Card>
      ) : (
        upcomingEvents.map((event) => (
          <Card key={event.id}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventMeta}>Date: {getCalendarEventDateKey(event)}</Text>
            <Text style={styles.eventMeta}>Time: {event.time}</Text>
            <Text style={styles.eventMeta}>Category: {event.category}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  eventTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  eventMeta: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

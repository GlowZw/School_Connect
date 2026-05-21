import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import {
  calendarEventsQueryKey,
  useCalendarEvents,
} from '@/features/calendar/use-calendar-events';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventDateKey,
} from '@/features/calendar/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { CalendarEvent, EventAudience, EventCategory } from '@/types/calendar';

type CalendarWorkspaceProps = {
  mode: 'parent' | 'teacher' | 'admin';
};

type ViewMode = 'month' | 'week' | 'list' | 'upcoming';

const categories: EventCategory[] = ['school', 'class', 'sports', 'exam', 'meeting', 'assignment'];
const audienceOptions: EventAudience[] = ['parents', 'students', 'teachers', 'class'];
const reminderOptions = ['1 day before', 'Night before', '2 hours before'];
const filters: Array<'all' | EventCategory> = ['all', 'school', 'class', 'exam'];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isEventVisibleToParent(event: CalendarEvent) {
  return event.audience.includes('parents') || event.audience.includes('class');
}

export function CalendarWorkspace({ mode }: CalendarWorkspaceProps) {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const canManage = mode === 'teacher' || mode === 'admin';
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<'all' | EventCategory>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('school');
  const [audience, setAudience] = useState<EventAudience[]>(['parents']);

  const { data: rawEvents = [], isLoading } = useCalendarEvents(schoolId);

  const events = useMemo(() => {
    const visibleEvents = mode === 'parent' ? rawEvents.filter(isEventVisibleToParent) : rawEvents;

    return visibleEvents.filter((event) => filter === 'all' || event.category === filter);
  }, [filter, mode, rawEvents]);

  const selectedEvents = events.filter((event) => getCalendarEventDateKey(event) === selectedDate);
  const upcomingEvents = events.filter((event) => getCalendarEventDateKey(event) >= formatDate(new Date()));

  const markedDates = useMemo(() => {
    return events.reduce<Record<string, { marked: boolean; selected?: boolean; dotColor: string }>>(
      (marks, event) => {
        const key = getCalendarEventDateKey(event);
        marks[key] = {
          marked: true,
          selected: key === selectedDate,
          dotColor: theme.colors.secondary,
        };
        return marks;
      },
      {
        [selectedDate]: {
          marked: selectedEvents.length > 0,
          selected: true,
          dotColor: theme.colors.secondary,
        },
      },
    );
  }, [events, selectedDate, selectedEvents.length]);

  const createMutation = useMutation({
    mutationFn: () =>
      createCalendarEvent(schoolId ?? '', profile?.uid ?? '', {
        title,
        description,
        category,
        eventDate: new Date(`${selectedDate}T09:00:00`),
        reminderTimes: reminderOptions,
        audience,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: calendarEventsQueryKey(schoolId) });
      setModalVisible(false);
      setTitle('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteCalendarEvent(schoolId ?? '', eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarEventsQueryKey(schoolId) }),
  });

  const eventList = viewMode === 'upcoming' || viewMode === 'list' ? upcomingEvents : selectedEvents;

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{mode === 'parent' ? 'Parent Portal' : mode === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}</Text>
          <Text style={styles.title}>Calendar</Text>
        </View>
        {canManage ? (
          <Pressable onPress={() => setModalVisible(true)} style={styles.iconButton}>
            <AppIcon name="plus" size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.segment}>
        {(['month', 'week', 'list', 'upcoming'] as ViewMode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setViewMode(item)}
            style={[styles.segmentItem, viewMode === item ? styles.segmentItemActive : null]}
          >
            <Text style={[styles.segmentText, viewMode === item ? styles.segmentTextActive : null]}>
              {item[0].toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'parent' ? (
        <View style={styles.filters}>
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, filter === item ? styles.filterActive : null]}
            >
              <Text style={filter === item ? styles.filterTextActive : styles.filterText}>
                {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {viewMode === 'month' || viewMode === 'week' ? (
        <Card>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            theme={{
              todayTextColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
            }}
          />
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {viewMode === 'upcoming' || viewMode === 'list' ? 'Upcoming Events' : selectedDate}
        </Text>
        {isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      </View>

      {eventList.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No calendar events available.</Text>
        </Card>
      ) : (
        eventList.map((event) => (
          <Card key={event.id}>
            <View style={styles.eventHeader}>
              <View style={styles.eventTitleGroup}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{getCalendarEventDateKey(event)}</Text>
              </View>
              <Chip label={event.category} tone="accent" />
            </View>
            {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
            <Text style={styles.eventMeta}>Reminders: {event.reminderTimes.join(', ')}</Text>
            {canManage ? (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => Alert.alert('Edit event', 'Open this event from the form to update details.')}
                  style={styles.secondaryButton}
                >
                  <AppIcon color={theme.colors.primary} name="edit-2" size={16} />
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteMutation.mutate(event.id)}
                  style={styles.dangerButton}
                >
                  <AppIcon color={theme.colors.danger} name="trash-2" size={16} />
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ))
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Screen scrollable>
          <View style={styles.header}>
            <Text style={styles.title}>Add Event</Text>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <AppIcon color={theme.colors.text} name="x" size={20} />
            </Pressable>
          </View>
          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={title}
          />
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.input, styles.textarea]}
            value={description}
          />
          <Text style={styles.label}>Category</Text>
          <View style={styles.filters}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.filterButton, category === item ? styles.filterActive : null]}
              >
                <Text style={category === item ? styles.filterTextActive : styles.filterText}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Audience</Text>
          <View style={styles.filters}>
            {audienceOptions.map((item) => {
              const selected = audience.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    setAudience((current) =>
                      selected ? current.filter((value) => value !== item) : [...current, item],
                    )
                  }
                  style={[styles.filterButton, selected ? styles.filterActive : null]}
                >
                  <Text style={selected ? styles.filterTextActive : styles.filterText}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton
            disabled={!title || !schoolId}
            label="Save Event"
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  segment: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  segmentItemActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: theme.colors.surface,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterButton: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  eventHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  eventTitleGroup: {
    flex: 1,
  },
  eventTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  eventMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  description: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dangerButton: {
    alignItems: 'center',
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    padding: theme.spacing.md,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  label: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { getAttendancePercentage } from '@/features/attendance/service';
import { useAttendanceRecords } from '@/features/attendance/use-attendance-records';
import { useCalendarEvents } from '@/features/calendar/use-calendar-events';
import { getCalendarEventDateKey } from '@/features/calendar/service';
import { listClasses, subscribeParentStudents } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { StudentProfile } from '@/types/students';

type ChildTab = 'overview' | 'classes' | 'attendance' | 'calendar' | 'schedule';

const childTabs: ChildTab[] = ['overview', 'classes', 'attendance', 'calendar', 'schedule'];

export function MyKidsDashboard() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const parentId = profile?.uid;
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChildTab>('overview');

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId && parentId),
    queryKey: ['parent-students', schoolId, parentId],
    queryFn: () => Promise.resolve([] as StudentProfile[]),
  });

  useEffect(() => {
    if (!schoolId || !parentId) {
      return undefined;
    }

    return subscribeParentStudents(schoolId, parentId, (students) => {
      queryClient.setQueryData(['parent-students', schoolId, parentId], students);
      if (!selectedStudentId && students[0]) {
        setSelectedStudentId(students[0].id);
      }
    });
  }, [parentId, queryClient, schoolId, selectedStudentId]);

  const classesQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['classes', schoolId],
    queryFn: () => listClasses(schoolId ?? ''),
  });

  const students = studentsQuery.data ?? [];
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const attendanceQuery = useAttendanceRecords(schoolId, { studentId: selectedStudent?.id });
  const calendarQuery = useCalendarEvents(schoolId);

  const childClasses = useMemo(() => {
    const classes = classesQuery.data ?? [];
    if (!selectedStudent) {
      return [];
    }

    return classes.filter((schoolClass) => selectedStudent.classIds.includes(schoolClass.id));
  }, [classesQuery.data, selectedStudent]);

  const attendanceRecords = attendanceQuery.data ?? [];
  const attendancePercentage = getAttendancePercentage(attendanceRecords);
  const upcomingEvent = (calendarQuery.data ?? []).find(
    (event) => getCalendarEventDateKey(event) >= new Date().toISOString().slice(0, 10),
  );

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Parent Portal</Text>
        <Text style={styles.title}>My Kids</Text>
      </View>

      {students.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No children are linked to this parent account yet.</Text>
        </Card>
      ) : (
        <View style={styles.childList}>
          {students.map((student) => (
            <Pressable
              key={student.id}
              onPress={() => setSelectedStudentId(student.id)}
              style={[
                styles.childCard,
                selectedStudent?.id === student.id ? styles.childCardActive : null,
              ]}
            >
              {student.photoUrl ? (
                <Image source={{ uri: student.photoUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoFallback}>
                  <AppIcon name="user" size={20} />
                </View>
              )}
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{student.fullName}</Text>
                <Text style={styles.childMeta}>
                  {student.className ?? childClasses[0]?.name ?? 'Class pending'}
                </Text>
                <Text style={styles.childMeta}>Attendance {attendancePercentage}%</Text>
                <Text style={styles.childMeta}>
                  Upcoming {upcomingEvent?.title ?? 'No event scheduled'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {selectedStudent ? (
        <>
          <View style={styles.tabs}>
            {childTabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab ? styles.tabActive : null]}
              >
                <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{tab}</Text>
              </Pressable>
            ))}
          </View>

          <Card>
            {activeTab === 'overview' ? (
              <>
                <Text style={styles.sectionTitle}>{selectedStudent.fullName}</Text>
                <Text style={styles.bodyText}>Classes: {childClasses.map((item) => item.name).join(', ') || 'None assigned'}</Text>
                <Text style={styles.bodyText}>Attendance: {attendancePercentage}%</Text>
                <Text style={styles.bodyText}>Next event: {upcomingEvent?.title ?? 'No upcoming event'}</Text>
              </>
            ) : null}
            {activeTab === 'classes' ? (
              <>
                <Text style={styles.sectionTitle}>Classes</Text>
                {childClasses.map((schoolClass) => (
                  <Text key={schoolClass.id} style={styles.bodyText}>
                    {schoolClass.name} {schoolClass.scheduleSummary ? `- ${schoolClass.scheduleSummary}` : ''}
                  </Text>
                ))}
              </>
            ) : null}
            {activeTab === 'attendance' ? (
              <>
                <Text style={styles.sectionTitle}>Attendance</Text>
                {attendanceRecords.map((record) => (
                  <Text key={record.id} style={styles.bodyText}>
                    {record.date}: {record.status}
                  </Text>
                ))}
              </>
            ) : null}
            {activeTab === 'calendar' ? (
              <>
                <Text style={styles.sectionTitle}>Calendar</Text>
                {(calendarQuery.data ?? []).slice(0, 5).map((event) => (
                  <Text key={event.id} style={styles.bodyText}>
                    {getCalendarEventDateKey(event)}: {event.title}
                  </Text>
                ))}
              </>
            ) : null}
            {activeTab === 'schedule' ? (
              <>
                <Text style={styles.sectionTitle}>Schedule</Text>
                {childClasses.map((schoolClass) => (
                  <Text key={schoolClass.id} style={styles.bodyText}>
                    {schoolClass.name}: {schoolClass.scheduleSummary ?? 'Schedule pending'}
                  </Text>
                ))}
              </>
            ) : null}
          </Card>
        </>
      ) : null}
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
  childList: {
    gap: theme.spacing.md,
  },
  childCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  childCardActive: {
    borderColor: theme.colors.primary,
  },
  photo: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  photoFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  childInfo: {
    flex: 1,
    gap: 2,
  },
  childName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  childMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tab: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: theme.colors.surface,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  bodyText: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

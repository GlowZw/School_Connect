import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  attendanceQueryKey,
  useAttendanceRecords,
} from '@/features/attendance/use-attendance-records';
import { getAttendancePercentage, markAttendance } from '@/features/attendance/service';
import { listClasses, listSchoolStudents } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { AttendanceStatus } from '@/types/attendance';

type AttendanceWorkspaceProps = {
  mode: 'teacher' | 'admin';
};

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceWorkspace({ mode }: AttendanceWorkspaceProps) {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['classes', schoolId],
    queryFn: () => listClasses(schoolId ?? ''),
  });

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['students', schoolId],
    queryFn: () => listSchoolStudents(schoolId ?? ''),
  });

  const classes = classesQuery.data ?? [];
  const students = useMemo(() => {
    const allStudents = studentsQuery.data ?? [];
    if (!selectedClassId) {
      return allStudents;
    }

    return allStudents.filter((student) => student.classIds.includes(selectedClassId));
  }, [selectedClassId, studentsQuery.data]);

  const attendanceQuery = useAttendanceRecords(schoolId, { classId: selectedClassId });
  const records = attendanceQuery.data ?? [];

  const markMutation = useMutation({
    mutationFn: ({
      studentId,
      status,
    }: {
      studentId: string;
      status: AttendanceStatus;
    }) =>
      markAttendance({
        schoolId: schoolId ?? '',
        classId: selectedClassId ?? students.find((student) => student.id === studentId)?.classIds[0] ?? 'unassigned',
        studentId,
        status,
        markedBy: profile?.uid ?? '',
        date: todayKey(),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKey(schoolId, { classId: selectedClassId }),
      }),
  });

  const analytics = useMemo(() => {
    return {
      present: records.filter((record) => record.status === 'present').length,
      absent: records.filter((record) => record.status === 'absent').length,
      late: records.filter((record) => record.status === 'late').length,
      excused: records.filter((record) => record.status === 'excused').length,
      attendance: getAttendancePercentage(records),
    };
  }, [records]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>{mode === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}</Text>
        <Text style={styles.title}>Attendance</Text>
      </View>

      <View style={styles.classList}>
        <Pressable
          onPress={() => setSelectedClassId(undefined)}
          style={[styles.classChip, !selectedClassId ? styles.classChipActive : null]}
        >
          <Text style={!selectedClassId ? styles.classChipTextActive : styles.classChipText}>All</Text>
        </Pressable>
        {classes.map((schoolClass) => (
          <Pressable
            key={schoolClass.id}
            onPress={() => setSelectedClassId(schoolClass.id)}
            style={[
              styles.classChip,
              selectedClassId === schoolClass.id ? styles.classChipActive : null,
            ]}
          >
            <Text
              style={
                selectedClassId === schoolClass.id
                  ? styles.classChipTextActive
                  : styles.classChipText
              }
            >
              {schoolClass.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'admin' ? (
        <View style={styles.analyticsGrid}>
          <Card>
            <Text style={styles.metricValue}>{analytics.attendance}%</Text>
            <Text style={styles.metricLabel}>Attendance</Text>
          </Card>
          <Card>
            <Text style={styles.metricValue}>{analytics.absent}</Text>
            <Text style={styles.metricLabel}>Absent</Text>
          </Card>
        </View>
      ) : null}

      {students.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No students are available for this class.</Text>
        </Card>
      ) : (
        students.map((student) => {
          const latest = records.find((record) => record.studentId === student.id);

          return (
            <Card key={student.id}>
              <View style={styles.studentHeader}>
                <View style={styles.avatar}>
                  <AppIcon name="user" size={18} />
                </View>
                <View style={styles.studentText}>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.studentMeta}>
                    {student.className ?? (student.classIds.join(', ') || 'No class assigned')}
                  </Text>
                </View>
                <Text style={styles.statusText}>{latest?.status ?? 'unmarked'}</Text>
              </View>
              <View style={styles.statusGrid}>
                {statuses.map((status) => (
                  <PrimaryButton
                    key={status}
                    disabled={markMutation.isPending}
                    label={status}
                    onPress={() => markMutation.mutate({ studentId: student.id, status })}
                    style={status === latest?.status ? styles.activeStatusButton : styles.statusButton}
                  />
                ))}
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
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
  classList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  classChip: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  classChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  classChipText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  classChipTextActive: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
  studentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  studentText: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  studentMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  statusText: {
    color: theme.colors.secondary,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusButton: {
    backgroundColor: theme.colors.secondary,
    minWidth: 96,
    paddingHorizontal: theme.spacing.md,
  },
  activeStatusButton: {
    backgroundColor: theme.colors.primary,
    minWidth: 96,
    paddingHorizontal: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

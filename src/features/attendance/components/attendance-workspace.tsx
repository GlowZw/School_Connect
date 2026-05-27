import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SuccessModal } from '@/components/ui/status-modal';
import {
  attendanceQueryKey,
  useAttendanceRecords,
} from '@/features/attendance/use-attendance-records';
import { getAttendancePercentage, markAttendance } from '@/features/attendance/service';
import {
  listClasses,
  listSchoolStudents,
  listStudentsByClassIds,
  listTeacherClasses,
} from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { AttendanceStatus } from '@/types/attendance';

type AttendanceWorkspaceProps = {
  mode: 'teacher' | 'admin';
  initialClassId?: string;
};

const statuses: AttendanceStatus[] = ['present', 'absent'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceWorkspace({ initialClassId, mode }: AttendanceWorkspaceProps) {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(initialClassId);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['classes', schoolId, mode, profile?.uid],
    queryFn: () =>
      mode === 'teacher'
        ? listTeacherClasses(schoolId ?? '', profile?.uid ?? '')
        : listClasses(schoolId ?? ''),
    staleTime: 60_000,
  });

  const classes = classesQuery.data ?? [];
  const teacherClassIds = useMemo(
    () => (mode === 'teacher' ? classes.map((schoolClass) => schoolClass.id) : []),
    [classes, mode],
  );

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId && (mode === 'admin' || teacherClassIds.length > 0)),
    queryKey:
      mode === 'teacher'
        ? ['teacher-students', schoolId, profile?.uid, teacherClassIds]
        : ['students', schoolId],
    queryFn: () =>
      mode === 'teacher'
        ? listStudentsByClassIds(schoolId ?? '', teacherClassIds)
        : listSchoolStudents(schoolId ?? ''),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (mode === 'teacher' && !selectedClassId && classes[0]) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, mode, selectedClassId]);

  const students = useMemo(() => {
    const allStudents = studentsQuery.data ?? [];
    if (!selectedClassId) {
      return mode === 'teacher' ? [] : allStudents;
    }

    return allStudents.filter((student) => student.classIds.includes(selectedClassId));
  }, [mode, selectedClassId, studentsQuery.data]);

  const attendanceQuery = useAttendanceRecords(schoolId, { classId: selectedClassId });
  const records = attendanceQuery.data ?? [];

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) {
        throw new Error('Select a class before submitting attendance.');
      }

      const entries = students.map((student) => ({
        studentId: student.id,
        status: draftStatuses[student.id] ?? 'absent',
      }));

      await Promise.all(
        entries.map((entry) =>
          markAttendance({
            schoolId: schoolId ?? '',
            classId: selectedClassId,
            studentId: entry.studentId,
            status: entry.status,
            teacherId: profile?.uid,
            markedBy: profile?.uid ?? '',
            date: todayKey(),
          }),
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: attendanceQueryKey(schoolId, { classId: selectedClassId }),
      });
      setDraftStatuses({});
      setSuccessVisible(true);
    },
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
  const canSubmit =
    students.length > 0 && students.every((student) => Boolean(draftStatuses[student.id]));

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>{mode === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}</Text>
        <Text style={styles.title}>Attendance</Text>
      </View>

      <View style={styles.classList}>
        {mode === 'admin' ? (
          <Pressable
            onPress={() => setSelectedClassId(undefined)}
            style={[styles.classChip, !selectedClassId ? styles.classChipActive : null]}
          >
            <Text style={!selectedClassId ? styles.classChipTextActive : styles.classChipText}>
              All
            </Text>
          </Pressable>
        ) : null}
        {classes.map((schoolClass) => (
          <Pressable
            key={schoolClass.id}
            onPress={() => {
              setSelectedClassId(schoolClass.id);
              setDraftStatuses({});
            }}
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
          const studentClass = classes.find((schoolClass) =>
            student.classIds.includes(schoolClass.id),
          );

          return (
            <Card key={student.id}>
              <View style={styles.studentHeader}>
                <View style={styles.avatar}>
                  <AppIcon name="user" size={18} />
                </View>
                <View style={styles.studentText}>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.studentMeta}>
                    {student.className ?? studentClass?.name ?? 'No class assigned'}
                  </Text>
                </View>
                <Text style={styles.statusText}>
                  {draftStatuses[student.id] ?? latest?.status ?? 'unmarked'}
                </Text>
              </View>
              <View style={styles.statusGrid}>
                {statuses.map((status) => (
                  <PrimaryButton
                    key={status}
                    disabled={submitMutation.isPending}
                    label={status === 'present' ? 'Present' : 'Absent'}
                    onPress={() =>
                      setDraftStatuses((current) => ({ ...current, [student.id]: status }))
                    }
                    style={
                      status === (draftStatuses[student.id] ?? latest?.status)
                        ? styles.activeStatusButton
                        : styles.statusButton
                    }
                  />
                ))}
              </View>
            </Card>
          );
        })
      )}

      {mode === 'teacher' && students.length > 0 ? (
        <PrimaryButton
          disabled={!canSubmit || submitMutation.isPending}
          label="Submit Attendance"
          loading={submitMutation.isPending}
          onPress={() => submitMutation.mutate()}
        />
      ) : null}

      <SuccessModal
        message="Attendance records have been saved."
        onClose={() => setSuccessVisible(false)}
        title="Creation Successful"
        visible={successVisible}
      />
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

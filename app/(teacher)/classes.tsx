import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { getAttendancePercentage } from '@/features/attendance/service';
import { useAttendanceRecords } from '@/features/attendance/use-attendance-records';
import { listStudentsByClassIds, listTeacherClasses } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { ClassProfile } from '@/types/students';

export default function TeacherClassesScreen() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const teacherId = profile?.uid;
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const classesQuery = useQuery({
    enabled: Boolean(schoolId && teacherId),
    queryKey: ['teacher-classes', schoolId, teacherId],
    queryFn: () => listTeacherClasses(schoolId ?? '', teacherId ?? ''),
    staleTime: 60_000,
  });

  const classes = classesQuery.data ?? [];
  const classIds = useMemo(() => classes.map((schoolClass) => schoolClass.id), [classes]);

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId && classIds.length > 0),
    queryKey: ['teacher-students', schoolId, teacherId, classIds],
    queryFn: () => listStudentsByClassIds(schoolId ?? '', classIds),
    staleTime: 60_000,
  });

  const activeClass = classes.find((item) => item.id === selectedClassId) ?? classes[0];
  const students = useMemo(() => {
    const allStudents = studentsQuery.data ?? [];
    if (!activeClass) {
      return [];
    }

    return allStudents.filter((student) => student.classIds.includes(activeClass.id));
  }, [activeClass, studentsQuery.data]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const attendanceQuery = useAttendanceRecords(schoolId, { studentId: selectedStudent?.id });
  const attendancePercentage = getAttendancePercentage(attendanceQuery.data ?? []);

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Teacher Portal</Text>
        <Text style={styles.title}>Classes</Text>
      </View>

      <View style={styles.classList}>
        {classes.map((schoolClass) => (
          <ClassCard
            key={schoolClass.id}
            schoolClass={schoolClass}
            selected={activeClass?.id === schoolClass.id}
            studentCount={
              (studentsQuery.data ?? []).filter((student) =>
                student.classIds.includes(schoolClass.id),
              ).length
            }
            onPress={() => {
              setSelectedClassId(schoolClass.id);
              setSelectedStudentId(null);
            }}
          />
        ))}
      </View>

      {activeClass ? (
        <Card>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.sectionTitle}>{activeClass.name}</Text>
              <Text style={styles.metaText}>Student Count: {students.length}</Text>
            </View>
            <PrimaryButton
              label="Attendance"
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/attendance',
                  params: { classId: activeClass.id },
                } as never)
              }
              style={styles.attendanceButton}
            />
          </View>

          {students.length === 0 ? (
            <Text style={styles.emptyText}>No students are assigned to this class.</Text>
          ) : (
            students.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => setSelectedStudentId(student.id)}
                style={styles.studentRow}
              >
                <View style={styles.avatar}>
                  <AppIcon name="user" size={17} />
                </View>
                <View style={styles.studentCopy}>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.metaText}>{student.grade ?? 'Grade pending'}</Text>
                  <Text style={styles.metaText}>
                    {student.className ?? activeClass.name ?? 'No class assigned'}
                  </Text>
                </View>
                <AppIcon color={theme.colors.mutedText} name="chevron-right" size={18} />
              </Pressable>
            ))
          )}
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>No classes assigned yet.</Text>
        </Card>
      )}

      {selectedStudent ? (
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Student Profile</Text>
            <Pressable onPress={() => setSelectedStudentId(null)} style={styles.closeButton}>
              <AppIcon color={theme.colors.text} name="x" size={18} />
            </Pressable>
          </View>
          <ProfileLine label="Name" value={selectedStudent.firstName ?? selectedStudent.fullName} />
          <ProfileLine label="Surname" value={selectedStudent.surname ?? 'Pending'} />
          <ProfileLine label="Grade" value={selectedStudent.grade ?? 'Pending'} />
          <ProfileLine label="DOB" value={selectedStudent.dob ?? 'Pending'} />
          <ProfileLine label="Attendance Summary" value={`${attendancePercentage}%`} />
          <ProfileLine
            label="Parent Info"
            value={
              [selectedStudent.parentName, selectedStudent.parentEmail, selectedStudent.parentPhone]
                .filter(Boolean)
                .join(' / ') || 'Pending'
            }
          />
          <ProfileLine
            label="Notes"
            value={
              [selectedStudent.medicalNotes, selectedStudent.additionalNotes]
                .filter(Boolean)
                .join(' / ') || 'None'
            }
          />
        </Card>
      ) : null}
    </Screen>
  );
}

type ClassCardProps = {
  schoolClass: ClassProfile;
  selected: boolean;
  studentCount: number;
  onPress: () => void;
};

function ClassCard({ schoolClass, selected, studentCount, onPress }: ClassCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.classCard, selected ? styles.classCardActive : null]}
    >
      <Text style={styles.sectionTitle}>{schoolClass.name}</Text>
      <Text style={styles.metaText}>{schoolClass.grade ?? 'Grade pending'}</Text>
      <Text style={styles.metaText}>{schoolClass.subject ?? 'Subject pending'}</Text>
      <Text style={styles.metaText}>Student Count: {studentCount}</Text>
    </Pressable>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileLine}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
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
  classList: {
    gap: theme.spacing.md,
  },
  classCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  classCardActive: {
    borderColor: theme.colors.primary,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  metaText: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  attendanceButton: {
    minWidth: 120,
    paddingHorizontal: theme.spacing.md,
  },
  studentRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  studentCopy: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  profileLine: {
    gap: theme.spacing.xs,
  },
  profileLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  profileValue: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

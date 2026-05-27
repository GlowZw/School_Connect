import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { listStudentsByClassIds, listTeacherClasses } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';

export default function TeacherStudentsScreen() {
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

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Teacher Portal</Text>
        <Text style={styles.title}>Students</Text>
      </View>

      <View style={styles.classList}>
        {classes.map((schoolClass) => (
          <Pressable
            key={schoolClass.id}
            onPress={() => {
              setSelectedClassId(schoolClass.id);
              setSelectedStudentId(null);
            }}
            style={[
              styles.classChip,
              activeClass?.id === schoolClass.id ? styles.classChipActive : null,
            ]}
          >
            <Text
              style={
                activeClass?.id === schoolClass.id
                  ? styles.classChipTextActive
                  : styles.classChipText
              }
            >
              {schoolClass.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text style={styles.sectionTitle}>{activeClass?.name ?? 'Students'}</Text>
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
          <ProfileLine
            label="Class"
            value={selectedStudent.className ?? activeClass?.name ?? 'No class assigned'}
          />
          <ProfileLine label="Gender" value={selectedStudent.gender ?? 'Pending'} />
          <ProfileLine label="Student Number" value={selectedStudent.studentNumber ?? 'Pending'} />
        </Card>
      ) : null}
    </Screen>
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
  metaText: {
    color: theme.colors.mutedText,
    fontSize: 13,
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

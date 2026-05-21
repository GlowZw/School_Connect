import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import {
  createStudent,
  deleteStudent,
  listClasses,
  listSchoolStudents,
  updateStudent,
} from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { StudentInput, StudentProfile } from '@/types/students';

const emptyForm: StudentInput = {
  fullName: '',
  grade: '',
  className: '',
  classIds: [],
};

export default function AdminStudentsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['students', schoolId],
    queryFn: () => listSchoolStudents(schoolId ?? ''),
    staleTime: 60_000,
  });

  const classesQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['classes', schoolId],
    queryFn: () => listClasses(schoolId ?? ''),
    staleTime: 60_000,
  });

  const selectedClassIds = useMemo(() => new Set(form.classIds), [form.classIds]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!schoolId) {
        throw new Error('Missing school context.');
      }

      if (editingStudentId) {
        return updateStudent(schoolId, editingStudentId, form);
      }

      return createStudent(schoolId, form).then(() => undefined);
    },
    onSuccess: () => {
      setForm(emptyForm);
      setEditingStudentId(null);
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => {
      if (!schoolId) {
        throw new Error('Missing school context.');
      }

      return deleteStudent(schoolId, studentId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', schoolId] }),
  });

  const startEdit = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setForm({
      fullName: student.fullName,
      grade: student.grade ?? '',
      className: student.className ?? '',
      classIds: student.classIds,
      parentIds: student.parentIds,
    });
  };

  const toggleClass = (classId: string, className: string) => {
    setForm((current) => {
      const nextClassIds = current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId];

      return {
        ...current,
        classIds: nextClassIds,
        className: nextClassIds.includes(classId) ? className : current.className,
      };
    });
  };

  const students = studentsQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const canSave = Boolean(schoolId && form.fullName.trim() && form.grade.trim());

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Admin Portal</Text>
        <Text style={styles.title}>Students</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>{editingStudentId ? 'Edit student' : 'Add student'}</Text>
        <TextField
          label="Full name"
          onChangeText={(fullName) => setForm((current) => ({ ...current, fullName }))}
          value={form.fullName}
        />
        <TextField
          label="Grade"
          onChangeText={(grade) => setForm((current) => ({ ...current, grade }))}
          value={form.grade}
        />
        <TextField
          label="Class display name"
          onChangeText={(className) => setForm((current) => ({ ...current, className }))}
          value={form.className}
        />
        <View style={styles.classList}>
          {classes.map((schoolClass) => (
            <Pressable
              key={schoolClass.id}
              onPress={() => toggleClass(schoolClass.id, schoolClass.name)}
              style={[
                styles.classChip,
                selectedClassIds.has(schoolClass.id) ? styles.classChipActive : null,
              ]}
            >
              <Text
                style={
                  selectedClassIds.has(schoolClass.id)
                    ? styles.classChipTextActive
                    : styles.classChipText
                }
              >
                {schoolClass.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            disabled={!canSave}
            label={editingStudentId ? 'Save student' : 'Add student'}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          />
          {editingStudentId ? (
            <Pressable
              onPress={() => {
                setEditingStudentId(null);
                setForm(emptyForm);
              }}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryActionText}>Cancel edit</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      {students.map((student) => (
        <Card key={student.id}>
          <View style={styles.studentRow}>
            <View style={styles.studentCopy}>
              <Text style={styles.studentName}>{student.fullName}</Text>
              <Text style={styles.studentMeta}>
                {student.grade ?? 'Grade pending'} · {student.className ?? 'Class pending'}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable onPress={() => startEdit(student)} style={styles.smallAction}>
                <Text style={styles.smallActionText}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => deleteMutation.mutate(student.id)}
                style={[styles.smallAction, styles.deleteAction]}
              >
                <Text style={styles.deleteActionText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
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
  actions: {
    gap: theme.spacing.sm,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  secondaryActionText: {
    color: theme.colors.secondary,
    fontWeight: '800',
  },
  studentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  studentCopy: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  studentMeta: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  rowActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  smallAction: {
    backgroundColor: '#EFF3F8',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  smallActionText: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  deleteAction: {
    backgroundColor: '#FEE4E2',
  },
  deleteActionText: {
    color: theme.colors.danger,
    fontWeight: '800',
  },
});

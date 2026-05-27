import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SuccessModal } from '@/components/ui/status-modal';
import { TextField } from '@/components/ui/text-field';
import { assignTeacherToClass, listSchoolTeachers } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { ClassProfile, TeacherOption } from '@/types/students';

const gradeOptions = [
  'Elementary',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const subjectOptions = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'ICT',
  'Geography',
  'Business',
  'Art',
  'Other',
];

const defaultAssignment = {
  teacherId: '',
  className: '',
  grade: '',
  subject: '',
};

type AssignmentForm = typeof defaultAssignment;
type AssignmentErrors = Partial<Record<keyof AssignmentForm, string>>;

export default function AdminSettingsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const queryClient = useQueryClient();
  const [assignment, setAssignment] = useState(defaultAssignment);
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [successVisible, setSuccessVisible] = useState(false);

  const teachersQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['teachers', schoolId],
    queryFn: () => listSchoolTeachers(schoolId ?? ''),
    staleTime: 60_000,
  });

  const teachers = teachersQuery.data ?? [];
  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.uid === assignment.teacherId) ?? null,
    [assignment.teacherId, teachers],
  );

  const assignmentMutation = useMutation({
    mutationFn: () => {
      const nextErrors = validateAssignment(assignment, selectedTeacher);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0 || !schoolId || !selectedTeacher) {
        throw new Error('Complete all required assignment fields.');
      }

      return assignTeacherToClass(schoolId, selectedTeacher, {
        name: assignment.className.trim(),
        grade: assignment.grade,
        subject: assignment.subject,
      });
    },
    onSuccess: (classId, _variables, _context) => {
      const teacherId = assignment.teacherId;
      const assignedClass = {
        id: classId,
        schoolId: schoolId ?? '',
        name: assignment.className.trim(),
        grade: assignment.grade,
        subject: assignment.subject,
        teacherId,
        teacherIds: [teacherId],
      };

      queryClient.setQueryData<ClassProfile[]>(
        ['teacher-classes', schoolId, teacherId],
        (current) =>
          current
            ? [...current.filter((item) => item.id !== classId), assignedClass]
            : [assignedClass],
      );
      setAssignment(defaultAssignment);
      setErrors({});
      setSuccessVisible(true);
      queryClient.invalidateQueries({ queryKey: ['classes', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes', schoolId, teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students', schoolId, teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teachers', schoolId] });
    },
  });

  const canSubmit = Boolean(schoolId && !assignmentMutation.isPending);

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Admin Portal</Text>
        <Text style={styles.title}>Teacher Assignments</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Assign Teacher to Class</Text>
        <SelectField
          error={errors.teacherId}
          label="Teacher"
          loading={teachersQuery.isLoading}
          onSelect={(teacherId) => {
            setAssignment((current) => ({ ...current, teacherId }));
            setErrors((current) => ({ ...current, teacherId: undefined }));
          }}
          options={teachers.map((teacher) => ({
            label: teacher.name,
            meta: teacher.email,
            value: teacher.uid,
          }))}
          placeholder="Select Teacher"
          value={assignment.teacherId}
        />
        <TextField
          error={errors.className}
          label="Class Name"
          onChangeText={(className) => {
            setAssignment((current) => ({ ...current, className }));
            setErrors((current) => ({ ...current, className: undefined }));
          }}
          value={assignment.className}
        />
        <SelectField
          error={errors.grade}
          label="Grade"
          onSelect={(grade) => {
            setAssignment((current) => ({ ...current, grade }));
            setErrors((current) => ({ ...current, grade: undefined }));
          }}
          options={gradeOptions.map((grade) => ({ label: grade, value: grade }))}
          placeholder="Select Grade"
          value={assignment.grade}
        />
        <SelectField
          error={errors.subject}
          label="Subject"
          onSelect={(subject) => {
            setAssignment((current) => ({ ...current, subject }));
            setErrors((current) => ({ ...current, subject: undefined }));
          }}
          options={subjectOptions.map((subject) => ({ label: subject, value: subject }))}
          placeholder="Select Subject"
          value={assignment.subject}
        />
        {assignmentMutation.isError ? (
          <Text style={styles.errorText}>{assignmentMutation.error.message}</Text>
        ) : null}
        <PrimaryButton
          disabled={!canSubmit}
          label="Assign Teacher"
          loading={assignmentMutation.isPending}
          onPress={() => assignmentMutation.mutate()}
        />
      </Card>

      <SuccessModal
        message="The class has been created and linked to the selected teacher."
        onClose={() => setSuccessVisible(false)}
        title="Assignment Successful"
        visible={successVisible}
      />
    </Screen>
  );
}

function validateAssignment(
  assignment: AssignmentForm,
  selectedTeacher: TeacherOption | null,
): AssignmentErrors {
  const nextErrors: AssignmentErrors = {};

  if (!selectedTeacher) {
    nextErrors.teacherId = 'Select a teacher.';
  }

  if (!assignment.className.trim()) {
    nextErrors.className = 'Enter a class name.';
  }

  if (!assignment.grade) {
    nextErrors.grade = 'Select a grade.';
  }

  if (!assignment.subject) {
    nextErrors.subject = 'Select a subject.';
  }

  return nextErrors;
}

type SelectOption = {
  label: string;
  value: string;
  meta?: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  error?: string;
  loading?: boolean;
};

function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  error,
  loading = false,
}: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption
    ? selectedOption.meta
      ? `${selectedOption.label}\n${selectedOption.meta}`
      : selectedOption.label
    : loading
      ? 'Loading...'
      : placeholder;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={loading}
        onPress={() => setVisible(true)}
        style={[styles.selectInput, error ? styles.inputError : null]}
      >
        <Text
          numberOfLines={selectedOption?.meta ? 2 : 1}
          style={[styles.selectText, selectedOption ? null : styles.placeholderText]}
        >
          {displayValue}
        </Text>
        <AppIcon color={theme.colors.mutedText} name="chevron-down" size={18} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <Pressable onPress={() => setVisible(false)} style={styles.modalOverlay}>
          <Pressable style={styles.optionPanel}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.optionList}>
              {options.length === 0 ? (
                <Text style={styles.emptyText}>No options available.</Text>
              ) : (
                options.map((option) => {
                  const selected = option.value === value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        onSelect(option.value);
                        setVisible(false);
                      }}
                      style={[styles.optionRow, selected ? styles.optionRowSelected : null]}
                    >
                      <View style={styles.optionCopy}>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                        {option.meta ? <Text style={styles.optionMeta}>{option.meta}</Text> : null}
                      </View>
                      {selected ? (
                        <AppIcon color={theme.colors.success} name="check" size={18} />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  selectInput: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectText: {
    color: theme.colors.text,
    flex: 1,
    lineHeight: 20,
  },
  placeholderText: {
    color: theme.colors.mutedText,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(19,28,48,0.52)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  optionPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    maxHeight: '78%',
    maxWidth: 460,
    padding: theme.spacing.md,
    width: '100%',
    ...theme.shadow.card,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  optionList: {
    width: '100%',
  },
  optionRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: theme.spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.background,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionMeta: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.mutedText,
    paddingVertical: theme.spacing.md,
  },
});

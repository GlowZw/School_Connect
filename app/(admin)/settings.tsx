import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { assignTeacherToClass } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';

const defaultAssignment = {
  teacherId: '',
  classId: '',
  name: '',
  grade: '',
  subject: '',
  scheduleSummary: '',
};

export default function AdminSettingsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const queryClient = useQueryClient();
  const [assignment, setAssignment] = useState(defaultAssignment);

  const assignmentMutation = useMutation({
    mutationFn: () => {
      if (!schoolId) {
        throw new Error('Missing school context.');
      }

      return assignTeacherToClass(schoolId, assignment.teacherId.trim(), {
        classId: assignment.classId.trim(),
        name: assignment.name.trim(),
        grade: assignment.grade.trim(),
        subject: assignment.subject.trim(),
        scheduleSummary: assignment.scheduleSummary.trim(),
      });
    },
    onSuccess: () => {
      setAssignment(defaultAssignment);
      queryClient.invalidateQueries({ queryKey: ['classes', schoolId] });
    },
  });

  const canAssign = Boolean(
    schoolId &&
      assignment.teacherId.trim() &&
      assignment.classId.trim() &&
      assignment.name.trim() &&
      assignment.grade.trim() &&
      assignment.subject.trim(),
  );

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Admin Portal</Text>
        <Text style={styles.title}>Teacher Assignments</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Assign teacher to class</Text>
        <TextField
          autoCapitalize="none"
          label="Teacher UID"
          onChangeText={(teacherId) => setAssignment((current) => ({ ...current, teacherId }))}
          value={assignment.teacherId}
        />
        <TextField
          autoCapitalize="none"
          label="Class ID"
          onChangeText={(classId) => setAssignment((current) => ({ ...current, classId }))}
          value={assignment.classId}
        />
        <TextField
          label="Class name"
          onChangeText={(name) => setAssignment((current) => ({ ...current, name }))}
          value={assignment.name}
        />
        <TextField
          label="Grade"
          onChangeText={(grade) => setAssignment((current) => ({ ...current, grade }))}
          value={assignment.grade}
        />
        <TextField
          label="Subject"
          onChangeText={(subject) => setAssignment((current) => ({ ...current, subject }))}
          value={assignment.subject}
        />
        <TextField
          label="Schedule summary"
          onChangeText={(scheduleSummary) =>
            setAssignment((current) => ({ ...current, scheduleSummary }))
          }
          value={assignment.scheduleSummary}
        />
        <PrimaryButton
          disabled={!canAssign}
          label="Assign teacher"
          loading={assignmentMutation.isPending}
          onPress={() => assignmentMutation.mutate()}
        />
      </Card>
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
});

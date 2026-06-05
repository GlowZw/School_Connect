import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { ErrorModal, SuccessModal } from '@/components/ui/status-modal';
import { getAttendancePercentage } from '@/features/attendance/service';
import { useAttendanceRecords } from '@/features/attendance/use-attendance-records';
import { formatLocalDate, getCalendarEventDateKey } from '@/features/calendar/service';
import { useCalendarEvents } from '@/features/calendar/use-calendar-events';
import {
  createStudent,
  linkParentToStudent,
  listClasses,
  subscribeParentStudents,
} from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';
import { theme } from '@/theme';
import type { StudentInput, StudentProfile } from '@/types/students';

type ChildTab = 'overview' | 'classes' | 'attendance' | 'calendar' | 'schedule';
type ChildGender = 'Male' | 'Female';
type ChildForm = {
  id: string;
  firstName: string;
  surname: string;
  dob: string;
  grade: string;
  gender: ChildGender | '';
  allergies: string;
  additionalNotes: string;
};
type ChildFormErrors = Partial<Record<keyof ChildForm, string>>;

const childTabs: ChildTab[] = ['overview', 'classes', 'attendance', 'calendar', 'schedule'];
const genderOptions: ChildGender[] = ['Male', 'Female'];

function createEmptyChildForm(): ChildForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    firstName: '',
    surname: '',
    dob: '',
    grade: '',
    gender: '',
    allergies: '',
    additionalNotes: '',
  };
}

function addYears(dateKey: string, years: number) {
  const nextDate = new Date(`${dateKey}T00:00:00`);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return formatLocalDate(nextDate);
}

function validateChildForm(form: ChildForm): ChildFormErrors {
  return {
    firstName: form.firstName.trim() ? undefined : 'First name is required.',
    surname: form.surname.trim() ? undefined : 'Surname is required.',
    dob: form.dob ? undefined : 'Date of birth is required.',
    grade: form.grade.trim() ? undefined : 'Grade year is required.',
    gender: form.gender ? undefined : 'Gender is required.',
  };
}

function hasErrors(errors: ChildFormErrors) {
  return Object.values(errors).some(Boolean);
}

export function MyKidsDashboard() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const parentId = profile?.uid;
  const parentEmail = profile?.email;
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChildTab>('overview');
  const [childForms, setChildForms] = useState<ChildForm[]>([createEmptyChildForm()]);
  const [formErrors, setFormErrors] = useState<Record<string, ChildFormErrors>>({});
  const [dobFormId, setDobFormId] = useState<string | null>(null);
  const [dobPickerMonth, setDobPickerMonth] = useState(formatLocalDate(new Date()));
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Child has been added.');
  const [errorVisible, setErrorVisible] = useState(false);

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId && parentId),
    queryKey: ['parent-students', schoolId, parentId, parentEmail],
    queryFn: () => Promise.resolve([] as StudentProfile[]),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!schoolId || !parentId) {
      return undefined;
    }

    return subscribeParentStudents(schoolId, parentId, parentEmail, (students) => {
      queryClient.setQueryData(['parent-students', schoolId, parentId, parentEmail], students);
      setSelectedStudentId((current) => current ?? students[0]?.id ?? null);
    });
  }, [parentEmail, parentId, queryClient, schoolId]);

  const classesQuery = useQuery({
    enabled: Boolean(schoolId),
    queryKey: ['classes', schoolId],
    queryFn: () => listClasses(schoolId ?? ''),
    staleTime: 60_000,
  });

  const students = studentsQuery.data ?? [];
  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? students[0];
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
    (event) => getCalendarEventDateKey(event) >= formatLocalDate(new Date()),
  );
  const selectedDobForm = childForms.find((form) => form.id === dobFormId);

  const updateChildForm = (id: string, updates: Partial<ChildForm>) => {
    setChildForms((current) =>
      current.map((form) => (form.id === id ? { ...form, ...updates } : form)),
    );
    setFormErrors((current) => {
      const nextErrors = { ...(current[id] ?? {}) };
      Object.keys(updates).forEach((key) => {
        delete nextErrors[key as keyof ChildFormErrors];
      });
      return { ...current, [id]: nextErrors };
    });
  };

  const addChildForm = () => {
    setChildForms((current) => [...current, createEmptyChildForm()]);
  };

  const openDobPicker = (form: ChildForm) => {
    setDobFormId(form.id);
    setDobPickerMonth(form.dob || formatLocalDate(new Date()));
  };

  const saveChildrenMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !parentId) {
        throw new Error('Parent account is not ready.');
      }

      const nextErrors = childForms.reduce<Record<string, ChildFormErrors>>((errors, form) => {
        errors[form.id] = validateChildForm(form);
        return errors;
      }, {});

      setFormErrors(nextErrors);

      if (Object.values(nextErrors).some(hasErrors)) {
        throw new Error('Please complete the required child fields.');
      }

      const savedIds = await Promise.all(
        childForms.map(async (form) => {
          const payload: StudentInput = {
            fullName: `${form.firstName.trim()} ${form.surname.trim()}`.trim(),
            firstName: form.firstName.trim(),
            surname: form.surname.trim(),
            grade: form.grade.trim(),
            className: '',
            classIds: [],
            parentIds: [parentId],
            dob: form.dob,
            gender: form.gender || undefined,
            allergies: form.allergies.trim() || undefined,
            additionalNotes: form.additionalNotes.trim() || undefined,
            parentEmail,
            parentName: profile?.displayName,
          };

          const studentId = await createStudent(schoolId, payload);
          await linkParentToStudent(schoolId, parentId, studentId);
          return studentId;
        }),
      );

      return savedIds.length;
    },
    onSuccess: async (savedCount) => {
      await queryClient.invalidateQueries({
        queryKey: ['parent-students', schoolId, parentId, parentEmail],
      });
      setChildForms([createEmptyChildForm()]);
      setFormErrors({});
      setSelectedStudentId(null);
      setSuccessMessage(savedCount === 1 ? 'Child has been added.' : 'Children have been added.');
      setSuccessVisible(true);
    },
    onError: () => {
      setErrorVisible(true);
    },
  });

  return (
    <Screen scrollable>
      <View>
        <Text style={styles.eyebrow}>Parent Portal</Text>
        <Text style={styles.title}>My Kids</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Add Child</Text>
        {childForms.map((form, index) => {
          const errors = formErrors[form.id] ?? {};

          return (
            <View key={form.id} style={styles.childForm}>
              {childForms.length > 1 ? (
                <Text style={styles.formTitle}>Child {index + 1}</Text>
              ) : null}
              <TextInput
                onChangeText={(firstName) => updateChildForm(form.id, { firstName })}
                placeholder="First Name"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={form.firstName}
              />
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              <TextInput
                onChangeText={(surname) => updateChildForm(form.id, { surname })}
                placeholder="Surname"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={form.surname}
              />
              {errors.surname ? <Text style={styles.errorText}>{errors.surname}</Text> : null}
              <Pressable onPress={() => openDobPicker(form)} style={styles.input}>
                <Text style={form.dob ? styles.inputText : styles.placeholderText}>
                  {form.dob || 'Date of Birth'}
                </Text>
              </Pressable>
              {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
              <TextInput
                onChangeText={(grade) => updateChildForm(form.id, { grade })}
                placeholder="Grade Year"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={form.grade}
              />
              {errors.grade ? <Text style={styles.errorText}>{errors.grade}</Text> : null}
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderGroup}>
                {genderOptions.map((gender) => (
                  <Pressable
                    key={gender}
                    onPress={() => updateChildForm(form.id, { gender })}
                    style={[
                      styles.genderOption,
                      form.gender === gender ? styles.genderActive : null,
                    ]}
                  >
                    <Text
                      style={form.gender === gender ? styles.genderTextActive : styles.genderText}
                    >
                      {gender}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
              <TextInput
                onChangeText={(allergies) => updateChildForm(form.id, { allergies })}
                placeholder="Allergies"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={form.allergies}
              />
              <TextInput
                multiline
                onChangeText={(additionalNotes) => updateChildForm(form.id, { additionalNotes })}
                placeholder="Additional Information"
                placeholderTextColor={theme.colors.mutedText}
                style={[styles.input, styles.textarea]}
                value={form.additionalNotes}
              />
            </View>
          );
        })}
        <Pressable onPress={addChildForm} style={styles.addAnotherButton}>
          <AppIcon color={theme.colors.primary} name="plus" size={16} />
          <Text style={styles.addAnotherText}>Add Another Child</Text>
        </Pressable>
        <PrimaryButton
          disabled={!schoolId || !parentId}
          label="Add Child"
          loading={saveChildrenMutation.isPending}
          onPress={() => saveChildrenMutation.mutate()}
        />
      </Card>

      {students.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No children are linked to this parent account yet.</Text>
        </Card>
      ) : (
        <View style={styles.childList}>
          {students.map((student) => (
            <Pressable
              key={student.id}
              onPress={() => {
                setSelectedStudentId(student.id);
                setActiveTab('attendance');
              }}
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
                <Text style={styles.sectionTitle}>Profile info</Text>
                <Text style={styles.bodyText}>Name: {selectedStudent.fullName}</Text>
                <Text style={styles.bodyText}>
                  DOB: {selectedStudent.dob ?? 'Date of birth pending'}
                </Text>
                <Text style={styles.bodyText}>
                  Gender: {selectedStudent.gender ?? 'Gender pending'}
                </Text>
                <Text style={styles.bodyText}>
                  Grade: {selectedStudent.grade ?? 'Grade pending'}
                </Text>
                <Text style={styles.bodyText}>
                  Primary class:{' '}
                  {selectedStudent.className ?? childClasses[0]?.name ?? 'Class pending'}
                </Text>
                <View style={styles.profileDivider} />
                <Text style={styles.sectionTitle}>Academic info</Text>
                <Text style={styles.bodyText}>
                  Classes: {childClasses.map((item) => item.name).join(', ') || 'None assigned'}
                </Text>
                <Text style={styles.bodyText}>
                  Subjects:{' '}
                  {childClasses
                    .map((item) => item.subject)
                    .filter(Boolean)
                    .join(', ') || 'Subjects pending'}
                </Text>
                <View style={styles.profileDivider} />
                <Text style={styles.sectionTitle}>Attendance summary</Text>
                <Text style={styles.bodyText}>Attendance: {attendancePercentage}%</Text>
                <Text style={styles.bodyText}>Records reviewed: {attendanceRecords.length}</Text>
                <Text style={styles.bodyText}>
                  Next event: {upcomingEvent?.title ?? 'No upcoming event'}
                </Text>
              </>
            ) : null}
            {activeTab === 'classes' ? (
              <>
                <Text style={styles.sectionTitle}>Classes</Text>
                {childClasses.map((schoolClass) => (
                  <Text key={schoolClass.id} style={styles.bodyText}>
                    {schoolClass.name}{' '}
                    {schoolClass.scheduleSummary ? `- ${schoolClass.scheduleSummary}` : ''}
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

      <Modal
        animationType="slide"
        onRequestClose={() => setDobFormId(null)}
        visible={Boolean(dobFormId)}
      >
        <Screen scrollable>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Date of Birth</Text>
            <Pressable onPress={() => setDobFormId(null)} style={styles.closeButton}>
              <AppIcon color={theme.colors.text} name="x" size={20} />
            </Pressable>
          </View>
          <View style={styles.yearControls}>
            <Pressable
              onPress={() => setDobPickerMonth((current) => addYears(current, -1))}
              style={styles.yearButton}
            >
              <Text style={styles.yearButtonText}>Previous Year</Text>
            </Pressable>
            <Pressable
              onPress={() => setDobPickerMonth((current) => addYears(current, 1))}
              style={styles.yearButton}
            >
              <Text style={styles.yearButtonText}>Next Year</Text>
            </Pressable>
          </View>
          <Card>
            <Calendar
              current={dobPickerMonth}
              key={dobPickerMonth}
              markedDates={
                selectedDobForm?.dob
                  ? {
                      [selectedDobForm.dob]: {
                        selected: true,
                        selectedColor: theme.colors.primary,
                      },
                    }
                  : undefined
              }
              onDayPress={(day) => {
                if (dobFormId) {
                  updateChildForm(dobFormId, { dob: day.dateString });
                }
                setDobPickerMonth(day.dateString);
                setDobFormId(null);
              }}
              onMonthChange={(day) => setDobPickerMonth(day.dateString)}
              theme={{
                arrowColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                todayTextColor: theme.colors.primary,
              }}
            />
          </Card>
        </Screen>
      </Modal>

      <SuccessModal
        message={successMessage}
        onClose={() => setSuccessVisible(false)}
        title="Creation Successful"
        visible={successVisible}
      />
      <ErrorModal
        message="Please complete the required fields before saving."
        onClose={() => setErrorVisible(false)}
        title="Unable to Add Child"
        visible={errorVisible}
      />
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
  childForm: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  formTitle: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.text,
    padding: theme.spacing.md,
  },
  inputText: {
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.mutedText,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  label: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  genderGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  genderOption: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  genderActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  genderTextActive: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  addAnotherButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  addAnotherText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  yearControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  yearButton: {
    alignItems: 'center',
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flex: 1,
    padding: theme.spacing.sm,
  },
  yearButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
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
  profileDivider: {
    backgroundColor: theme.colors.border,
    height: 1,
    marginVertical: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.mutedText,
  },
});

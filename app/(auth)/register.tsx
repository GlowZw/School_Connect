import { Link } from 'expo-router';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthFormShell } from '@/components/auth/auth-form-shell';
import { SchoolSelector } from '@/components/auth/school-selector';
import { Chip } from '@/components/ui/chip';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { register } from '@/features/auth/auth-service';
import { type RegisterFormValues, registerSchema } from '@/features/auth/validation';
import type { SchoolDirectoryEntry } from '@/services/tenant/school-service';
import { theme } from '@/theme';
import type { UserRole } from '@/types/auth';

const roleOptions: Array<{
  role: UserRole;
  title: string;
  description: string;
}> = [
  {
    role: 'parent',
    title: 'Parent',
    description: 'Access fees, messages, awards, activities, and lunch updates.',
  },
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Manage communication, activities, and student engagement updates.',
  },
  {
    role: 'admin',
    title: 'Admin',
    description: 'Manage school operations, payments, recognition, and publishing.',
  },
];

export default function RegisterScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDirectoryEntry | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      schoolId: '',
      role: 'parent',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await register(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to register.');
    }
  });

  const primaryColor = selectedSchool?.branding.primaryColor || theme.colors.primary;

  return (
    <Screen scrollable>
      <AuthFormShell
        title="Create school account access"
        description="Register with the school identifier assigned during tenant onboarding."
      >
        <View style={{ gap: theme.spacing.md }}>
          {selectedSchool?.logoUrl ? (
            <Image
              source={{ uri: selectedSchool.logoUrl }}
              style={styles.schoolLogo}
              resizeMode="contain"
            />
          ) : null}

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextField
                error={errors.fullName?.message}
                label="Full name"
                onChangeText={onChange}
                value={value}
                selectionColor={primaryColor}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextField
                autoCapitalize="none"
                error={errors.email?.message}
                keyboardType="email-address"
                label="Email address"
                onChangeText={onChange}
                value={value}
                selectionColor={primaryColor}
              />
            )}
          />
          <Controller
            control={control}
            name="schoolId"
            render={({ field: { value } }) => (
              <SchoolSelector
                selectedSchoolId={value}
                customPrimaryColor={primaryColor}
                onSelect={(school) => {
                  setValue('schoolId', school.id, { shouldValidate: true });
                  setSelectedSchool(school);
                }}
                error={errors.schoolId?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>I am registering as</Text>
                <View style={styles.roleList}>
                  {roleOptions.map((option) => {
                    const selected = value === option.role;

                    return (
                      <Pressable
                        key={option.role}
                        onPress={() => onChange(option.role)}
                        style={[
                          styles.roleCard,
                          selected ? { borderColor: primaryColor, backgroundColor: selectedSchool ? (selectedSchool.id === 'SCH-001' ? '#ECFDF5' : '#F5F3FF') : '#F7F2FF' } : null,
                        ]}
                      >
                        <View style={styles.roleHeader}>
                          <Text style={[styles.roleTitle, selected && { color: primaryColor }]}>{option.title}</Text>
                          {selected ? <Chip label="Selected" tone="accent" /> : null}
                        </View>
                        <Text style={styles.roleDescription}>{option.description}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.role?.message ? <Text style={styles.error}>{errors.role.message}</Text> : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextField
                autoCapitalize="none"
                error={errors.password?.message}
                label="Password"
                onChangeText={onChange}
                secureTextEntry
                value={value}
                selectionColor={primaryColor}
              />
            )}
          />
          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <PrimaryButton
            label="Register"
            loading={isSubmitting}
            onPress={onSubmit}
            style={{ backgroundColor: primaryColor }}
          />
        </View>
      </AuthFormShell>
      <Link href="/(auth)/login" style={[styles.backLink, { color: primaryColor }]}>Back to sign in</Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  roleSection: {
    gap: theme.spacing.sm,
  },
  roleLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  roleList: {
    gap: theme.spacing.sm,
  },
  roleCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F7F2FF',
  },
  schoolLogo: {
    alignSelf: 'center',
    height: 72,
    width: 72,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roleTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  roleDescription: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: theme.colors.danger,
  },
  backLink: {
    color: theme.colors.secondary,
    fontWeight: '700',
  },
});

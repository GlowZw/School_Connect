import { Link } from 'expo-router';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthFormShell } from '@/components/auth/auth-form-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { register } from '@/features/auth/auth-service';
import { type RegisterFormValues, registerSchema } from '@/features/auth/validation';
import { theme } from '@/theme';

export default function RegisterScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      schoolId: '',
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

  return (
    <Screen scrollable>
      <AuthFormShell
        title="Create school account access"
        description="Register with the school identifier assigned during tenant onboarding."
      >
        <View style={{ gap: theme.spacing.md }}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextField
                error={errors.fullName?.message}
                label="Full name"
                onChangeText={onChange}
                value={value}
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
              />
            )}
          />
          <Controller
            control={control}
            name="schoolId"
            render={({ field: { onChange, value } }) => (
              <TextField
                autoCapitalize="none"
                error={errors.schoolId?.message}
                label="School ID"
                onChangeText={onChange}
                value={value}
              />
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
              />
            )}
          />
          {submitError ? <Text style={{ color: theme.colors.danger }}>{submitError}</Text> : null}
          <PrimaryButton label="Register" loading={isSubmitting} onPress={onSubmit} />
        </View>
      </AuthFormShell>
      <Link href="/(auth)/login">Back to sign in</Link>
    </Screen>
  );
}

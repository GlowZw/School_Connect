import { Link } from 'expo-router';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthFormShell } from '@/components/auth/auth-form-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { requestPasswordReset } from '@/features/auth/auth-service';
import { type ResetPasswordFormValues, resetPasswordSchema } from '@/features/auth/validation';
import { theme } from '@/theme';

export default function ForgotPasswordScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitted(false);

    try {
      await requestPasswordReset(values);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send reset email.');
    }
  });

  return (
    <Screen scrollable>
      <AuthFormShell
        title="Reset password"
        description="Submit your account email to receive a password reset link."
      >
        <View style={{ gap: theme.spacing.md }}>
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
          {submitError ? <Text style={{ color: theme.colors.danger }}>{submitError}</Text> : null}
          {submitted ? (
            <Text style={{ color: theme.colors.secondary }}>
              Reset instructions have been requested for this account.
            </Text>
          ) : null}
          <PrimaryButton label="Send reset link" loading={isSubmitting} onPress={onSubmit} />
        </View>
      </AuthFormShell>
      <Link href="/(auth)/login">Back to sign in</Link>
    </Screen>
  );
}

import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AuthFormShell } from '@/components/auth/auth-form-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SuccessModal } from '@/components/ui/status-modal';
import { TextField } from '@/components/ui/text-field';
import { login } from '@/features/auth/auth-service';
import { type LoginFormValues, loginSchema } from '@/features/auth/validation';
import { theme } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await login(values);
      setSuccessVisible(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  });

  return (
    <Screen scrollable>
      <AuthFormShell
        title="Welcome back"
        description="Sign in with your school-linked account to access your portal."
      >
        <View style={styles.form}>
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
          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <PrimaryButton label="Sign in" loading={isSubmitting} onPress={onSubmit} />
        </View>
      </AuthFormShell>
      <View style={styles.links}>
        <Link href="/(auth)/register" style={styles.link}>
          Create an account
        </Link>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Reset password
        </Link>
      </View>
      <SuccessModal
        title="Sign In Successfully"
        visible={successVisible}
        onClose={() => {
          setSuccessVisible(false);
          router.replace('/');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },
  links: {
    gap: theme.spacing.sm,
  },
  link: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.danger,
  },
});

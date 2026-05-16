import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { theme } from '@/theme';

type AuthFormShellProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function AuthFormShell({ title, description, children }: AuthFormShellProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Card>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  description: {
    fontSize: 15,
    color: theme.colors.mutedText,
  },
});

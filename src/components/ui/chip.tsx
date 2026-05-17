import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

type ChipProps = {
  label: string;
  tone?: ChipTone;
};

export function Chip({ label, tone = 'neutral' }: ChipProps) {
  return (
    <View style={[styles.base, chipToneStyles[tone]]}>
      <Text style={[styles.label, chipTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const chipToneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: '#EFF3F8',
  },
  success: {
    backgroundColor: '#E8F8ED',
  },
  warning: {
    backgroundColor: '#FFF4DF',
  },
  danger: {
    backgroundColor: '#FDECEC',
  },
  accent: {
    backgroundColor: '#F1EAFF',
  },
});

const chipTextStyles = StyleSheet.create({
  neutral: {
    color: theme.colors.mutedText,
  },
  success: {
    color: theme.colors.success,
  },
  warning: {
    color: theme.colors.warning,
  },
  danger: {
    color: theme.colors.danger,
  },
  accent: {
    color: theme.colors.primary,
  },
});

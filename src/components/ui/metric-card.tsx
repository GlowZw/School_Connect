import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/card';
import { theme } from '@/theme';

type MetricCardProps = {
  label: string;
  value: string;
  meta?: string;
};

export function MetricCard({ label, value, meta }: MetricCardProps) {
  return (
    <Card>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  meta: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});

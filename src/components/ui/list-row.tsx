import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Card } from '@/components/ui/card';
import { theme } from '@/theme';

type ListRowProps = {
  title: string;
  subtitle: string;
  meta?: string;
  badge?: {
    label: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  };
};

export function ListRow({ title, subtitle, meta, badge }: ListRowProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {badge ? <Chip label={badge.label} tone={badge.tone} /> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  meta: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});

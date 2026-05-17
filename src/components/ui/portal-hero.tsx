import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type PortalHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PortalHero({ eyebrow, title, description }: PortalHeroProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.sidebar,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: '#C9D4F0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: theme.colors.surface,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: '#D5DCF0',
    lineHeight: 21,
  },
});

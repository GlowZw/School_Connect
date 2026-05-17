import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { theme } from '@/theme';

type ActionTileProps = {
  title: string;
  description: string;
  accent?: string;
  onPress?: () => void;
};

export function ActionTile({
  title,
  description,
  accent = theme.colors.primary,
  onPress,
}: ActionTileProps) {
  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: accent }]} />
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
});

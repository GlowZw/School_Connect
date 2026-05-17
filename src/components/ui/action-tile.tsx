import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { theme } from '@/theme';

type ActionTileProps = {
  title: string;
  description: string;
  accent?: string;
  iconName: AppIconName;
  onPress?: () => void;
};

export function ActionTile({
  title,
  description,
  accent = theme.colors.primary,
  iconName,
  onPress,
}: ActionTileProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 8,
      tension: 110,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
      >
        <Card>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: accent }]}>
              <AppIcon name={iconName} size={18} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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

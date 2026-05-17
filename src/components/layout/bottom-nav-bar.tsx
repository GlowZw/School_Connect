import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { theme } from '@/theme';

export type BottomNavKey = 'home' | 'back' | 'notifications' | 'profile' | 'settings';

type BottomNavItem = {
  key: BottomNavKey;
  label: string;
  iconName: AppIconName;
};

type BottomNavBarProps = {
  activeKey: BottomNavKey | null;
  onPress: (key: BottomNavKey) => void;
};

const items: BottomNavItem[] = [
  { key: 'home', label: 'Home', iconName: 'home' },
  { key: 'back', label: 'Back', iconName: 'arrow-left' },
  { key: 'notifications', label: 'Alerts', iconName: 'bell' },
  { key: 'profile', label: 'Profile', iconName: 'user' },
  { key: 'settings', label: 'Settings', iconName: 'settings' },
];

export function BottomNavBar({ activeKey, onPress }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <BottomNavButton
          active={activeKey === item.key}
          iconName={item.iconName}
          key={item.key}
          label={item.label}
          onPress={() => onPress(item.key)}
        />
      ))}
    </View>
  );
}

type BottomNavButtonProps = {
  active: boolean;
  iconName: AppIconName;
  label: string;
  onPress: () => void;
};

function BottomNavButton({ active, iconName, label, onPress }: BottomNavButtonProps) {
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
    <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, active ? styles.buttonActive : null]}
      >
        <AppIcon
          color={active ? theme.colors.primary : theme.colors.mutedText}
          name={iconName}
          size={18}
        />
        <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(216,224,236,0.9)',
    ...theme.shadow.card,
  },
  buttonWrap: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  buttonActive: {
    backgroundColor: '#F3EEFF',
  },
  label: {
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: theme.colors.primary,
  },
});

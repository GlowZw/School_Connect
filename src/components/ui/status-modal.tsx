import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { theme } from '@/theme';

type StatusModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttonLabel?: string;
  iconName: AppIconName;
  iconColor: string;
  onClose: () => void;
};

function StatusModal({
  visible,
  title,
  message,
  buttonLabel = 'OK',
  iconName,
  iconColor,
  onClose,
}: StatusModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 110,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
            <AppIcon color={iconColor} name={iconName} size={32} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable onPress={onClose} style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}>
            <Text style={styles.buttonLabel}>{buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

type PublicStatusModalProps = Pick<
  StatusModalProps,
  'visible' | 'title' | 'message' | 'buttonLabel' | 'onClose'
>;

export function SuccessModal(props: PublicStatusModalProps) {
  return <StatusModal {...props} iconColor={theme.colors.success} iconName="check-circle" />;
}

export function ErrorModal(props: PublicStatusModalProps) {
  return <StatusModal {...props} iconColor={theme.colors.danger} iconName="alert-circle" />;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(19,28,48,0.52)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 420,
    padding: theme.spacing.lg,
    width: '100%',
    ...theme.shadow.card,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    minWidth: 120,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
});

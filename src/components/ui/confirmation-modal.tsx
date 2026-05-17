import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
}: ConfirmationModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
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
    <Modal animationType="none" onRequestClose={onCancel} transparent visible={visible}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={styles.dismissArea} onPress={onCancel} />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.secondaryButton}>
              <Text style={styles.secondaryLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              disabled={confirmDisabled}
              onPress={onConfirm}
              style={[styles.primaryButton, confirmDisabled ? styles.primaryButtonDisabled : null]}
            >
              <Text style={styles.primaryLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Pressable style={styles.dismissArea} onPress={onCancel} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,28,48,0.52)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: theme.colors.mutedText,
    lineHeight: 22,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: '#EFF3F8',
  },
  secondaryLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  primaryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.danger,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryLabel: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});

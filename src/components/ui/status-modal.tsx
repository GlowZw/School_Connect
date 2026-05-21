import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { theme } from '@/theme';

type StatusModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  iconName: AppIconName;
  iconColor: string;
  onClose: () => void;
  autoDismissMs?: number;
};

function StatusModal({
  visible,
  title,
  message,
  iconName,
  iconColor,
  onClose,
  autoDismissMs = 1500,
}: StatusModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

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

    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => closeRef.current());
    }, autoDismissMs);

    return () => clearTimeout(timeout);
  }, [autoDismissMs, opacity, scale, visible]);

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
            <AppIcon color={iconColor} name={iconName} size={32} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

type PublicStatusModalProps = Pick<
  StatusModalProps,
  'visible' | 'title' | 'message' | 'onClose' | 'autoDismissMs'
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
});

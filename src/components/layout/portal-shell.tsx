import type { PropsWithChildren } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { BottomNavBar, type BottomNavKey } from '@/components/layout/bottom-nav-bar';
import {
  getActiveBottomKey,
  getHomeRoute,
  getNavigationItems,
  getSettingsRoute,
  isNavigationItemActive,
} from '@/components/layout/portal-navigation';
import { AppIcon } from '@/components/ui/app-icon';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { logout } from '@/features/auth/auth-service';
import { useTenantStore } from '@/store/tenant-store';
import { theme } from '@/theme';
import type { UserRole } from '@/types/auth';
import type { AppPermission } from '@/types/permissions';

type PortalShellProps = PropsWithChildren<{
  role: UserRole | 'shared';
  accountRole: UserRole;
  displayName: string;
  email: string;
  permissions?: AppPermission[];
}>;

const roleLabels: Record<PortalShellProps['role'], string> = {
  parent: 'Parent Account',
  teacher: 'Teacher Account',
  admin: 'Admin Account',
  shared: 'Shared Workspace',
};

export function PortalShell({
  role,
  accountRole,
  displayName,
  email,
  permissions = [],
  children,
}: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isCompact = width < 920;
  const schoolName = useTenantStore((state) => state.schoolName);
  const initials = useMemo(() => getInitials(displayName || email), [displayName, email]);
  const navItems = getNavigationItems(role, permissions);
  const headerTitle = schoolName || 'School Connect';
  const roleLabel = roleLabels[accountRole];

  const handleNavigate = (href: string) => {
    router.replace(href as never);
    if (isCompact) {
      setSidebarOpen(false);
    }
  };

  const activeBottomKey = getActiveBottomKey(pathname, accountRole);

  const handleBottomNavPress = (key: BottomNavKey) => {
    if (key === 'home') {
      handleNavigate(getHomeRoute(accountRole));
      return;
    }

    if (key === 'back') {
      router.back();
      return;
    }

    if (key === 'notifications') {
      handleNavigate('/shared/notifications');
      return;
    }

    if (key === 'profile') {
      handleNavigate('/shared/profile');
      return;
    }

    handleNavigate(getSettingsRoute(accountRole));
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <View style={styles.sidebarContent}>
      <View style={styles.brandBlock}>
        <Text style={styles.brandTitle}>School-Connect</Text>
        <Text style={styles.brandSubtitle}>Multi-tenant school workspace</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.profileName}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.profileEmail}>
            {email}
          </Text>
          <Text style={styles.profileRole}>{roleLabels[role]}</Text>
        </View>
      </View>

      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Navigation</Text>
        <ScrollView
          contentContainerStyle={styles.navList}
          showsVerticalScrollIndicator={false}
          style={styles.navScroller}
        >
          {navItems.map((item) => {
            const active = isNavigationItemActive(pathname, item.href);

            return (
              <SidebarNavButton
                active={active}
                iconName={item.iconName}
                key={item.href}
                label={item.label}
                onPress={() => handleNavigate(item.href)}
              />
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        onPress={() => setShowLogoutModal(true)}
        style={[styles.logoutButton, isLoggingOut ? styles.logoutButtonDisabled : null]}
      >
        <Text style={styles.logoutText}>{isLoggingOut ? 'Signing out...' : 'Log out'}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {!isCompact ? <View style={styles.sidebar}>{sidebarContent}</View> : null}

        <View style={[styles.main, isCompact ? styles.mainCompact : null]}>
          <View style={styles.topBar}>
            <View style={styles.topBarLeading}>
              {isCompact ? (
                <Pressable onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                  <AppIcon color={theme.colors.primary} name="menu" size={18} />
                </Pressable>
              ) : null}
              <Text style={styles.topBarTitle}>{headerTitle}</Text>
              <Text style={styles.topBarSubtitle}>({roleLabel})</Text>
            </View>
            <View style={styles.topBarProfile}>
              <View style={styles.topBarAvatar}>
                <Text style={styles.topBarAvatarText}>{initials}</Text>
              </View>
              <View style={styles.topBarProfileCopy}>
                <Text numberOfLines={1} style={styles.topBarName}>
                  {displayName}
                </Text>
                <Text style={styles.topBarRole}>{roleLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.content}>{children}</View>
          <BottomNavBar activeKey={activeBottomKey} onPress={handleBottomNavPress} />
        </View>
      </View>

      {isCompact ? (
        <Modal
          animationType="slide"
          onRequestClose={() => setSidebarOpen(false)}
          transparent
          visible={sidebarOpen}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalDismissArea} onPress={() => setSidebarOpen(false)} />
            <View style={styles.modalSidebar}>
              <View style={styles.modalSidebarHeader}>
                <Text style={styles.modalSidebarTitle}>Navigation</Text>
                <Pressable onPress={() => setSidebarOpen(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
              {sidebarContent}
            </View>
          </View>
        </Modal>
      ) : null}

      <ConfirmationModal
        cancelLabel="No"
        confirmDisabled={isLoggingOut}
        confirmLabel={isLoggingOut ? 'Logging out...' : 'Yes'}
        message="Are you sure you want to logout?"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout"
        visible={showLogoutModal}
      />
    </SafeAreaView>
  );
}

type SidebarNavButtonProps = {
  active: boolean;
  iconName: Parameters<typeof AppIcon>[0]['name'];
  label: string;
  onPress: () => void;
};

function SidebarNavButton({ active, iconName, label, onPress }: SidebarNavButtonProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const animateTo = (value: number) => {
    Animated.timing(translateX, {
      toValue: value,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(4)}
        onPressOut={() => animateTo(0)}
        style={[styles.navItem, active ? styles.navItemActive : null]}
      >
        <AppIcon color={active ? theme.colors.surface : '#E2E8F7'} name={iconName} size={17} />
        <Text style={[styles.navText, active ? styles.navTextActive : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function getInitials(value: string) {
  const segments = value
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return 'SC';
  }

  return segments
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: theme.colors.sidebar,
  },
  sidebarContent: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  brandBlock: {
    gap: theme.spacing.xs,
  },
  brandTitle: {
    color: theme.colors.surface,
    fontSize: 24,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: theme.colors.sidebarMuted,
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 18,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  profileEmail: {
    color: '#D9E2F2',
    fontSize: 12,
  },
  profileRole: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  navSection: {
    gap: theme.spacing.sm,
    flex: 1,
    minHeight: 0,
  },
  navLabel: {
    color: theme.colors.sidebarMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  navList: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  navScroller: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
  },
  navText: {
    color: '#E2E8F7',
    fontWeight: '600',
    fontSize: 14,
  },
  navTextActive: {
    color: theme.colors.surface,
  },
  logoutButton: {
    backgroundColor: 'rgba(180,35,24,0.18)',
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: '#FFD8D2',
    fontWeight: '700',
  },
  main: {
    flex: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  mainCompact: {
    paddingTop: theme.spacing.sm,
  },
  topBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  topBarLeading: {
    gap: theme.spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1EAFF',
    borderRadius: theme.radius.sm,
    padding: 9,
  },
  topBarTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  topBarSubtitle: {
    color: theme.colors.mutedText,
    fontSize: 13,
  },
  topBarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    maxWidth: '55%',
  },
  topBarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  topBarProfileCopy: {
    flexShrink: 1,
  },
  topBarName: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  topBarRole: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  content: {
    flex: 1,
    gap: theme.spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(19,28,48,0.38)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSidebar: {
    width: 300,
    maxWidth: '86%',
    backgroundColor: theme.colors.sidebar,
    paddingTop: theme.spacing.lg,
  },
  modalSidebarHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSidebarTitle: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#D9E2F2',
    fontWeight: '600',
  },
});

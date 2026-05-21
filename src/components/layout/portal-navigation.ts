import type { BottomNavKey } from '@/components/layout/bottom-nav-bar';
import { roleNavigationItems } from '@/constants/navigation';
import type { UserRole } from '@/types/auth';
import type { AppPermission } from '@/types/permissions';

export function getHomeRoute(role: UserRole) {
  return role === 'parent' ? '/(parent)' : role === 'teacher' ? '/(teacher)' : '/(admin)';
}

export function getSettingsRoute(role: UserRole) {
  return role === 'parent'
    ? '/(parent)/settings'
    : role === 'teacher'
      ? '/(teacher)/settings'
      : '/(admin)/settings';
}

export function getActiveBottomKey(pathname: string, role: UserRole): BottomNavKey | null {
  if (pathname === getHomeRoute(role)) {
    return 'home';
  }

  if (pathname === '/shared/notifications') {
    return 'notifications';
  }

  if (pathname === '/shared/profile') {
    return 'profile';
  }

  if (pathname === getSettingsRoute(role)) {
    return 'settings';
  }

  return null;
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === '/shared/messages' && pathname.startsWith('/shared/messages')) {
    return true;
  }

  if (
    href !== '/(parent)' &&
    href !== '/(teacher)' &&
    href !== '/(admin)' &&
    pathname.startsWith(href)
  ) {
    return true;
  }

  return false;
}

export function getNavigationItems(role: UserRole | 'shared', permissions: AppPermission[] = []) {
  return roleNavigationItems[role].filter(
    (item) =>
      !item.permissions ||
      item.permissions.length === 0 ||
      item.permissions.some((permission) => permissions.includes(permission)),
  );
}

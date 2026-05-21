import type { UserRole } from '@/types/auth';

export const roleHomeRoutes: Record<UserRole, `/(parent)` | `/(teacher)` | `/(admin)`> = {
  parent: '/(parent)',
  teacher: '/(teacher)',
  admin: '/(admin)',
};

export function getRoleHomeRoute(role: UserRole) {
  return roleHomeRoutes[role];
}

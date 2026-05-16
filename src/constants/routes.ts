import type { UserRole } from '@/types/auth';

export const roleHomeRoutes: Record<UserRole, `/(parent)` | `/(teacher)` | `/(admin)`> = {
  parent: '/(parent)',
  teacher: '/(teacher)',
  admin: '/(admin)',
};

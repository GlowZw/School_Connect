import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth-store';
import type { AppPermission } from '@/types/permissions';

export function usePermissionAccess(permission?: AppPermission) {
  const profile = useAuthStore((state) => state.profile);

  return useMemo(() => {
    const permissions = profile?.permissions ?? [];

    return {
      permissions,
      hasPermission: permission ? permissions.includes(permission) : true,
      hasAnyPermission: (...expected: AppPermission[]) =>
        expected.some((value) => permissions.includes(value)),
    };
  }, [permission, profile?.permissions]);
}

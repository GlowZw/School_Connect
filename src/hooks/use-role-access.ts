import { useMemo } from 'react';

import { roleHomeRoutes } from '@/constants/routes';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types/auth';

export function useRoleAccess(expectedRole?: UserRole) {
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);

  return useMemo(() => {
    const isAuthenticated = status === 'authenticated' && !!profile;
    const roleHome = profile ? roleHomeRoutes[profile.role] : '/(auth)/login';
    const roleMatches = expectedRole ? profile?.role === expectedRole : true;

    return {
      isAuthenticated,
      isLoading: status === 'idle' || status === 'loading',
      profile,
      roleHome,
      roleMatches,
    };
  }, [expectedRole, profile, status]);
}

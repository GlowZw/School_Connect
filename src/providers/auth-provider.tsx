import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { rolePermissions } from '@/constants/permissions';
import { getFirebaseAuth } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTenantStore } from '@/store/tenant-store';
import type { UserRole } from '@/types/auth';
import type { AppPermission } from '@/types/permissions';

function isUserRole(value: unknown): value is UserRole {
  return value === 'parent' || value === 'teacher' || value === 'admin';
}

function getPermissions(role: UserRole, claimedPermissions: unknown): AppPermission[] {
  if (Array.isArray(claimedPermissions)) {
    return claimedPermissions.filter(
      (permission): permission is AppPermission => typeof permission === 'string',
    );
  }

  return rolePermissions[role];
}

export function AuthProvider({ children }: PropsWithChildren) {
  const setProfile = useAuthStore((state) => state.setProfile);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setSchoolId = useTenantStore((state) => state.setSchoolId);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user || !user.email) {
        setProfile(null);
        setSchoolId(null);
        return;
      }

      const tokenResult = await user.getIdTokenResult();
      const claimedRole = tokenResult.claims.role;
      const role = isUserRole(claimedRole) ? claimedRole : 'parent';
      const schoolId =
        typeof tokenResult.claims.schoolId === 'string'
          ? tokenResult.claims.schoolId
          : 'pending-school-association';

      setProfile({
        uid: user.uid,
        email: user.email,
        schoolId,
        role,
        permissions: getPermissions(role, tokenResult.claims.permissions),
        emailVerified: user.emailVerified,
        displayName: user.displayName ?? undefined,
      });
      setSchoolId(schoolId);
    });

    return unsubscribe;
  }, [setProfile, setSchoolId, setStatus]);

  return children;
}

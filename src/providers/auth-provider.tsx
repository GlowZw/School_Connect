import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { rolePermissions } from '@/constants/permissions';
import { getUserProfile } from '@/features/auth/profile-service';
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

  useEffect(() => {
    setStatus('loading');
    let tenantUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      tenantUnsubscribe?.();
      tenantUnsubscribe = undefined;

      if (!user || !user.email) {
        setProfile(null);
        useTenantStore.getState().resetTenantContext();
        return;
      }

      const tokenResult = await user.getIdTokenResult();
      const claimedRole = tokenResult.claims.role;
      let schoolId =
        typeof tokenResult.claims.schoolId === 'string'
          ? tokenResult.claims.schoolId
          : 'pending-school-association';
      let role = isUserRole(claimedRole) ? claimedRole : null;
      let claimedPermissions = tokenResult.claims.permissions;
      let schoolName = 'Unknown School';

      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        if (!role || schoolId === 'pending-school-association') {
          role = userProfile.role;
          schoolId = userProfile.schoolId;
          claimedPermissions = userProfile.permissions;
        }
        schoolName = userProfile.schoolName || 'Unknown School';
      }

      if (!role) {
        role = 'parent';
      }

      let branding = null;
      let logoUrl = null;

      if (schoolId && schoolId !== 'pending-school-association') {
        const { getSchoolDirectoryEntry, subscribeSchoolDirectoryEntry } = await import(
          '@/services/tenant/school-service'
        );
        const schoolEntry = await getSchoolDirectoryEntry(schoolId);
        if (schoolEntry) {
          schoolName = schoolEntry.name;
          branding = schoolEntry.branding;
          logoUrl = schoolEntry.logoUrl;
        }
        tenantUnsubscribe = subscribeSchoolDirectoryEntry(schoolId, (nextSchool) => {
          if (nextSchool) {
            useTenantStore
              .getState()
              .setTenantContext(
                schoolId,
                nextSchool.name,
                nextSchool.branding,
                nextSchool.logoUrl,
              );
          }
        });
      }

      setProfile({
        uid: user.uid,
        email: user.email,
        schoolId,
        schoolName,
        role,
        permissions: getPermissions(role, claimedPermissions),
        emailVerified: user.emailVerified,
        displayName: user.displayName ?? undefined,
      });

      useTenantStore.getState().setTenantContext(
        schoolId,
        schoolName,
        branding,
        logoUrl,
      );

      if (schoolId && schoolId !== 'pending-school-association') {
        const { registerNotificationToken } = await import(
          '@/services/notifications/notification-service'
        );
        const notificationAudience =
          role === 'parent' ? 'parents' : role === 'teacher' ? 'teachers' : 'admin';
        await registerNotificationToken(schoolId, user.uid, [notificationAudience]).catch(
          () => undefined,
        );
      }
    });

    return () => {
      tenantUnsubscribe?.();
      unsubscribe();
    };
  }, [setProfile, setStatus]);

  return children;
}

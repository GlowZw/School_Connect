import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { getFirebaseAuth } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/auth-store';
import { useTenantStore } from '@/store/tenant-store';

export function AuthProvider({ children }: PropsWithChildren) {
  const setProfile = useAuthStore((state) => state.setProfile);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setSchoolId = useTenantStore((state) => state.setSchoolId);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user || !user.email) {
        setProfile(null);
        setSchoolId(null);
        return;
      }

      setProfile({
        uid: user.uid,
        email: user.email,
        schoolId: 'pending-school-association',
        role: 'parent',
        emailVerified: user.emailVerified,
        displayName: user.displayName ?? undefined,
      });
      setSchoolId('pending-school-association');
    });

    return unsubscribe;
  }, [setProfile, setSchoolId, setStatus]);

  return children;
}

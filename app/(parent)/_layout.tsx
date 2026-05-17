import { Redirect, Slot } from 'expo-router';

import { PortalShell } from '@/components/layout/portal-shell';
import { useRoleAccess } from '@/hooks/use-role-access';

export default function ParentLayout() {
  const { isAuthenticated, isLoading, profile, roleHome, roleMatches } = useRoleAccess('parent');

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isLoading && isAuthenticated && !roleMatches) {
    return <Redirect href={roleHome} />;
  }

  if (!profile) {
    return null;
  }

  return (
    <PortalShell
      accountRole="parent"
      displayName={profile.displayName ?? 'School Connect User'}
      email={profile.email}
      role="parent"
    >
      <Slot />
    </PortalShell>
  );
}

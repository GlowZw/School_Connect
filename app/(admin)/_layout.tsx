import { Redirect, Slot } from 'expo-router';

import { PortalShell } from '@/components/layout/portal-shell';
import { useRoleAccess } from '@/hooks/use-role-access';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, profile, roleHome, roleMatches } = useRoleAccess('admin');

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
      accountRole="admin"
      displayName={profile.displayName ?? 'School Connect User'}
      email={profile.email}
      role="admin"
    >
      <Slot />
    </PortalShell>
  );
}

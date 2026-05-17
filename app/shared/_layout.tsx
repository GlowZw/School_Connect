import { Redirect, Slot } from 'expo-router';

import { PortalShell } from '@/components/layout/portal-shell';
import { useRoleAccess } from '@/hooks/use-role-access';

export default function SharedLayout() {
  const { isAuthenticated, isLoading, profile } = useRoleAccess();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile) {
    return null;
  }

  return (
    <PortalShell
      accountRole={profile.role}
      displayName={profile.displayName ?? 'School Connect User'}
      email={profile.email}
      role="shared"
    >
      <Slot />
    </PortalShell>
  );
}

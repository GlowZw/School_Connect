import { Redirect, Stack } from 'expo-router';

import { useRoleAccess } from '@/hooks/use-role-access';

export default function ParentLayout() {
  const { isAuthenticated, isLoading, roleHome, roleMatches } = useRoleAccess('parent');

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isLoading && isAuthenticated && !roleMatches) {
    return <Redirect href={roleHome} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

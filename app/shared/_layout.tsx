import { Redirect, Stack } from 'expo-router';

import { useRoleAccess } from '@/hooks/use-role-access';

export default function SharedLayout() {
  const { isAuthenticated, isLoading } = useRoleAccess();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

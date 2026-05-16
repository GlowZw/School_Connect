import { Redirect, Stack } from 'expo-router';

import { useRoleAccess } from '@/hooks/use-role-access';

export default function TeacherLayout() {
  const { isAuthenticated, isLoading, roleHome, roleMatches } = useRoleAccess('teacher');

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isLoading && isAuthenticated && !roleMatches) {
    return <Redirect href={roleHome} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

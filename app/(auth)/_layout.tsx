import { Redirect, Stack } from 'expo-router';

import { useRoleAccess } from '@/hooks/use-role-access';

export default function AuthLayout() {
  const { isAuthenticated, profile } = useRoleAccess();

  if (isAuthenticated && profile) {
    return <Redirect href={`/${`(${profile.role})`}` as '/(parent)' | '/(teacher)' | '/(admin)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

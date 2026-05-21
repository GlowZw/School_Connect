import { Redirect } from 'expo-router';

import { getRoleHomeRoute } from '@/constants/routes';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const profile = useAuthStore((state) => state.profile);
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated' && profile) {
    return <Redirect href={getRoleHomeRoute(profile.role)} />;
  }

  return <Redirect href="/(auth)/login" />;
}

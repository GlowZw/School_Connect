import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/providers/auth-provider';
import { AppQueryProvider } from '@/providers/query-provider';

export default function RootLayout() {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </AppQueryProvider>
  );
}

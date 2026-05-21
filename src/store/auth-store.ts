import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthProfile, AuthStatus } from '@/types/auth';

type AuthStore = {
  profile: AuthProfile | null;
  status: AuthStatus;
  setProfile: (profile: AuthProfile | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      profile: null,
      status: 'idle',
      setProfile: (profile) =>
        set({
          profile,
          status: profile ? 'authenticated' : 'unauthenticated',
        }),
      setStatus: (status) => set({ status }),
      reset: () =>
        set({
          profile: null,
          status: 'unauthenticated',
        }),
    }),
    {
      name: 'school-connect-auth',
      partialize: (state) => ({ profile: state.profile }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

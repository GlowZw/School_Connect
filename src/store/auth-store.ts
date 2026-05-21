import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthProfile, AuthStatus, UserRole } from '@/types/auth';

type AuthStore = {
  profile: AuthProfile | null;
  user: AuthProfile | null;
  role: UserRole | null;
  schoolId: string | null;
  schoolName: string | null;
  status: AuthStatus;
  setProfile: (profile: AuthProfile | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      profile: null,
      user: null,
      role: null,
      schoolId: null,
      schoolName: null,
      status: 'idle',
      setProfile: (profile) =>
        set({
          profile,
          user: profile,
          role: profile?.role ?? null,
          schoolId: profile?.schoolId ?? null,
          schoolName: profile?.schoolName ?? null,
          status: profile ? 'authenticated' : 'unauthenticated',
        }),
      setStatus: (status) => set({ status }),
      reset: () =>
        set({
          profile: null,
          user: null,
          role: null,
          schoolId: null,
          schoolName: null,
          status: 'unauthenticated',
        }),
    }),
    {
      name: 'school-connect-auth',
      partialize: (state) => ({
        profile: state.profile,
        user: state.user,
        role: state.role,
        schoolId: state.schoolId,
        schoolName: state.schoolName,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

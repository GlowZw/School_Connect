import type { AppPermission } from '@/types/permissions';

export type UserRole = 'parent' | 'teacher' | 'admin';

export type AuthProfile = {
  uid: string;
  email: string;
  schoolId: string;
  schoolName: string;
  role: UserRole;
  permissions: AppPermission[];
  emailVerified: boolean;
  displayName?: string;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

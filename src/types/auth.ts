export type UserRole = 'parent' | 'teacher' | 'admin';

export type AuthProfile = {
  uid: string;
  email: string;
  schoolId: string;
  role: UserRole;
  emailVerified: boolean;
  displayName?: string;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

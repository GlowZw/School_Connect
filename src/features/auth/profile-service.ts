import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { rolePermissions } from '@/constants/permissions';
import { firestore } from '@/services/firebase/firestore';
import type { RegisterFormValues } from '@/features/auth/validation';
import type { AuthProfile } from '@/types/auth';

type StoredUserProfile = Pick<
  AuthProfile,
  'uid' | 'email' | 'schoolId' | 'schoolName' | 'role' | 'permissions'
> & {
  fullName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function createUserProfile(
  uid: string,
  values: Pick<RegisterFormValues, 'email' | 'fullName' | 'schoolId' | 'role'> & { schoolName: string },
) {
  const profile: StoredUserProfile = {
    uid,
    email: values.email,
    fullName: values.fullName,
    schoolId: values.schoolId,
    schoolName: values.schoolName,
    role: values.role,
    permissions: rolePermissions[values.role],
  };

  await setDoc(doc(firestore, 'user_profiles', uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(firestore, 'user_profiles', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as StoredUserProfile;
}

import { getAuth } from 'firebase/auth';

import type { Auth } from 'firebase/auth';

import { firebaseApp } from '@/services/firebase/config';

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  authInstance = getAuth(firebaseApp);

  return authInstance;
}

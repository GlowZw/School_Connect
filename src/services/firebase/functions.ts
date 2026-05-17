import { getFunctions } from 'firebase/functions';

import type { Functions } from 'firebase/functions';

import { firebaseApp } from '@/services/firebase/config';

let functionsInstance: Functions | null = null;

export function getFirebaseFunctions(): Functions {
  if (functionsInstance) {
    return functionsInstance;
  }

  functionsInstance = getFunctions(firebaseApp);

  return functionsInstance;
}

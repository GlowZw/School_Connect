import { getApp, getApps, initializeApp } from 'firebase/app';

import { firebaseEnv } from '@/utils/env';

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
  measurementId: firebaseEnv.measurementId,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

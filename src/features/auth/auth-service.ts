import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/services/firebase/auth';
import type {
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '@/features/auth/validation';

export async function login(values: LoginFormValues) {
  return signInWithEmailAndPassword(getFirebaseAuth(), values.email, values.password);
}

export async function register(values: RegisterFormValues) {
  const credentials = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    values.email,
    values.password,
  );

  await updateProfile(credentials.user, {
    displayName: values.fullName,
  });
  await sendEmailVerification(credentials.user);

  return credentials;
}

export async function requestPasswordReset(values: ResetPasswordFormValues) {
  return sendPasswordResetEmail(getFirebaseAuth(), values.email);
}

export async function logout() {
  return signOut(getFirebaseAuth());
}

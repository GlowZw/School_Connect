import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { defaultNotificationPreferences } from '@/constants/permissions';
import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import { registerForPushNotificationsAsync } from '@/services/firebase/messaging';
import type { NotificationPreferenceMap } from '@/types/permissions';

async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function registerNotificationToken(
  schoolId?: string,
  userId?: string,
  audiences: string[] = [],
) {
  const registration = await registerForPushNotificationsAsync();

  if (registration && schoolId && userId) {
    await withRetry(() =>
      setDoc(
        doc(firestore, schoolCollectionPath(schoolId, 'notification_tokens'), userId),
        {
          token: registration.token,
          tokenType: registration.type,
          platform: registration.type === 'fcm' ? 'android' : 'expo',
          userId,
          schoolId,
          audiences,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    );
  }

  return registration?.token ?? null;
}

export async function getNotificationPreferences(schoolId: string, userId: string) {
  const reference = doc(
    firestore,
    schoolCollectionPath(schoolId, 'notification_preferences'),
    userId,
  );
  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return defaultNotificationPreferences;
  }

  return {
    ...defaultNotificationPreferences,
    ...(snapshot.data() as Partial<NotificationPreferenceMap>),
  };
}

export async function updateNotificationPreferences(
  schoolId: string,
  userId: string,
  preferences: Partial<NotificationPreferenceMap>,
) {
  const reference = doc(
    firestore,
    schoolCollectionPath(schoolId, 'notification_preferences'),
    userId,
  );

  await setDoc(reference, preferences, { merge: true });
}

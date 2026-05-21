import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { defaultNotificationPreferences } from '@/constants/permissions';
import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import { registerForPushNotificationsAsync } from '@/services/firebase/messaging';
import type { NotificationPreferenceMap } from '@/types/permissions';

export async function registerNotificationToken(
  schoolId?: string,
  userId?: string,
  audiences: string[] = [],
) {
  const token = await registerForPushNotificationsAsync();

  if (token && schoolId && userId) {
    await setDoc(
      doc(firestore, schoolCollectionPath(schoolId, 'notification_tokens'), userId),
      {
        token,
        userId,
        schoolId,
        audiences,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return token;
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

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { NotificationCategory } from '@/types/permissions';

export type NotificationChannel = NotificationCategory;
export type RegisteredPushToken = {
  token: string;
  type: 'fcm' | 'expo';
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<RegisteredPushToken | null> {
  const permissions = await Notifications.getPermissionsAsync();
  const existingStatus = permissions.status;
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const nextPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = nextPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('school-connect-default', {
      name: 'School Connect',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

  if (!projectId) {
    return null;
  }

  if (Platform.OS === 'android') {
    const response = await Notifications.getDevicePushTokenAsync();
    return {
      token: response.data,
      type: 'fcm',
    };
  }

  const response = await Notifications.getExpoPushTokenAsync({ projectId });
  return {
    token: response.data,
    type: 'expo',
  };
}

export async function scheduleLocalNotificationAsync(input: {
  title: string;
  body: string;
  data?: Record<string, string>;
  secondsFromNow: number;
}) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      data: input.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: input.secondsFromNow,
      repeats: false,
    },
  });
}

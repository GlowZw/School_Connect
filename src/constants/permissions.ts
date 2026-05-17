import type { UserRole } from '@/types/auth';
import type {
  AppPermission,
  NotificationCategory,
  NotificationPreferenceMap,
} from '@/types/permissions';

export const rolePermissions: Record<UserRole, AppPermission[]> = {
  parent: ['canViewPayments'],
  teacher: [
    'canViewPayments',
    'canManageSports',
    'canManageCulture',
    'canUploadMedia',
    'canModerateMessages',
  ],
  admin: [
    'canManageStudents',
    'canManageTeachers',
    'canManageParents',
    'canManagePayments',
    'canViewPayments',
    'canSendBroadcasts',
    'canManageSports',
    'canManageCulture',
    'canPublishAwards',
    'canManageLunch',
    'canUploadMedia',
    'canModerateMessages',
    'canViewAnalytics',
  ],
};

export const notificationCategories: NotificationCategory[] = [
  'announcements',
  'reminders',
  'fees',
  'timetable',
  'messages',
  'payments',
  'sports',
  'awards',
  'events',
  'lunch',
];

export const defaultNotificationPreferences: NotificationPreferenceMap = {
  announcements: true,
  reminders: true,
  fees: true,
  timetable: true,
  messages: true,
  payments: true,
  sports: true,
  awards: true,
  events: true,
  lunch: true,
};

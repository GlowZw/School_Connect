export type AppPermission =
  | 'canManageStudents'
  | 'canManageTeachers'
  | 'canManageParents'
  | 'canManagePayments'
  | 'canViewPayments'
  | 'canSendBroadcasts'
  | 'canManageSports'
  | 'canManageCulture'
  | 'canPublishAwards'
  | 'canManageLunch'
  | 'canUploadMedia'
  | 'canModerateMessages'
  | 'canViewAnalytics';

export type NotificationCategory =
  | 'announcements'
  | 'reminders'
  | 'fees'
  | 'timetable'
  | 'messages'
  | 'payments'
  | 'sports'
  | 'awards'
  | 'events'
  | 'lunch';

export type NotificationPreferenceMap = Record<NotificationCategory, boolean>;

export type SchoolCollection =
  | 'info'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'classes'
  | 'timetables'
  | 'fee_records'
  | 'notifications'
  | 'calendar_events';

export type TenantScopedPath = `schools/${string}/${SchoolCollection}`;

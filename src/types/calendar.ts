import type { Timestamp } from 'firebase/firestore';

export type EventCategory = 'school' | 'class' | 'sports' | 'exam' | 'meeting' | 'assignment';

export type EventAudience = 'parents' | 'students' | 'teachers' | 'class';

export type CalendarEvent = {
  id: string;
  schoolId: string;
  createdBy: string;
  title: string;
  description: string;
  category: EventCategory;
  eventDate: Timestamp;
  reminderTimes: string[];
  audience: EventAudience[];
  classIds?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type CalendarEventInput = {
  title: string;
  description: string;
  category: EventCategory;
  eventDate: Date;
  reminderTimes: string[];
  audience: EventAudience[];
  classIds?: string[];
};

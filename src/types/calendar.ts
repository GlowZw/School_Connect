import type { Timestamp } from 'firebase/firestore';

export type EventCategory = 'school' | 'class' | 'sports' | 'exam' | 'meeting' | 'assignment';

export type EventAudience = 'parents' | 'students' | 'teachers' | 'class';

export type CalendarEvent = {
  id: string;
  schoolId: string;
  createdBy: string;
  createdByName?: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
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
  date: string;
  time: string;
  createdByName?: string;
  reminderTimes: string[];
  audience: EventAudience[];
  classIds?: string[];
};

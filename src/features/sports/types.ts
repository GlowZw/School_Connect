import type { Timestamp } from 'firebase/firestore';

export type ActivityKind = 'sports' | 'culture';

export type Team = {
  id: string;
  schoolId: string;
  name: string;
  category: ActivityKind;
  coachName: string;
  memberCount: number;
};

export type ActivityEvent = {
  id: string;
  schoolId: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  scheduledAt: Timestamp | Date;
  venue: string;
  result?: string;
  mediaUrls?: string[];
};

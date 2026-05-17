import type { Timestamp } from 'firebase/firestore';

export type AwardCategory = 'academic' | 'sports' | 'leadership' | 'service';

export type StudentAward = {
  id: string;
  schoolId: string;
  studentId: string;
  category: AwardCategory;
  title: string;
  description: string;
  certificateUrl?: string;
  awardedAt: Timestamp | Date;
};

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { StudentAward } from '@/features/awards/types';

export async function listStudentAwards(schoolId: string, studentId: string) {
  const awardsQuery = query(
    collection(firestore, schoolCollectionPath(schoolId, 'student_recognition')),
    where('studentId', '==', studentId),
    orderBy('awardedAt', 'desc'),
  );
  const snapshot = await getDocs(awardsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<StudentAward, 'id'>),
  }));
}

export const sampleAwards: StudentAward[] = [
  {
    id: 'award-1',
    schoolId: 'school-demo',
    studentId: 'student-1',
    category: 'academic',
    title: 'Top Mathematics Performer',
    description: 'Recognized for consistent distinction-level performance.',
    awardedAt: new Date('2026-05-03'),
    certificateUrl: 'https://example.com/certificate-1.pdf',
  },
  {
    id: 'award-2',
    schoolId: 'school-demo',
    studentId: 'student-1',
    category: 'leadership',
    title: 'Peer Leadership Commendation',
    description: 'Acknowledged for mentoring junior students during orientation.',
    awardedAt: new Date('2026-04-18'),
  },
];

import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { ActivityEvent, Team } from '@/features/sports/types';

export async function listTeams(schoolId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, schoolCollectionPath(schoolId, 'teams')), orderBy('name', 'asc')),
  );

  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Team, 'id'>) }));
}

export async function listActivityEvents(schoolId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'events')),
      orderBy('scheduledAt', 'asc'),
    ),
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<ActivityEvent, 'id'>),
  }));
}

export const sampleTeams: Team[] = [
  {
    id: 'team-1',
    schoolId: 'school-demo',
    name: 'Junior Netball',
    category: 'sports',
    coachName: 'Ms. Ncube',
    memberCount: 18,
  },
  {
    id: 'team-2',
    schoolId: 'school-demo',
    name: 'Debate Society',
    category: 'culture',
    coachName: 'Mr. Moyo',
    memberCount: 12,
  },
];

export const sampleActivityEvents: ActivityEvent[] = [
  {
    id: 'event-1',
    schoolId: 'school-demo',
    kind: 'sports',
    title: 'Inter-school Netball Fixture',
    subtitle: 'School Connect vs Greenfield Academy',
    scheduledAt: new Date('2026-05-22T14:00:00'),
    venue: 'Main Sports Ground',
    result: 'Upcoming',
  },
  {
    id: 'event-2',
    schoolId: 'school-demo',
    kind: 'culture',
    title: 'Choir Festival Rehearsal',
    subtitle: 'Regional performance preparation',
    scheduledAt: new Date('2026-05-24T10:00:00'),
    venue: 'Assembly Hall',
    result: 'Attendance required',
  },
];

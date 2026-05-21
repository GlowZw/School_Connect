import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type {
  ClassProfile,
  ParentStudentRelationship,
  StudentProfile,
} from '@/types/students';

function mapStudent(id: string, data: Record<string, unknown>, schoolId: string): StudentProfile {
  return {
    id,
    schoolId,
    fullName: String(data.fullName ?? data.name ?? 'Student'),
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
    classIds: Array.isArray(data.classIds)
      ? data.classIds.filter((item): item is string => typeof item === 'string')
      : [],
    className: typeof data.className === 'string' ? data.className : undefined,
  };
}

function mapClass(id: string, data: Record<string, unknown>, schoolId: string): ClassProfile {
  return {
    id,
    schoolId,
    name: String(data.name ?? data.title ?? id),
    grade: typeof data.grade === 'string' ? data.grade : undefined,
    teacherIds: Array.isArray(data.teacherIds)
      ? data.teacherIds.filter((item): item is string => typeof item === 'string')
      : [],
    scheduleSummary:
      typeof data.scheduleSummary === 'string' ? data.scheduleSummary : undefined,
  };
}

export async function getParentRelationship(
  schoolId: string,
  parentId: string,
): Promise<ParentStudentRelationship> {
  const snapshot = await getDoc(doc(firestore, schoolCollectionPath(schoolId, 'parents'), parentId));

  if (!snapshot.exists()) {
    return { parentId, studentIds: [] };
  }

  const data = snapshot.data();

  return {
    parentId,
    studentIds: Array.isArray(data.studentIds)
      ? data.studentIds.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

export async function listStudentsByIds(schoolId: string, studentIds: string[]) {
  if (studentIds.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    studentIds.map((studentId) =>
      getDoc(doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId)),
    ),
  );

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => mapStudent(snapshot.id, snapshot.data(), schoolId));
}

export async function listSchoolStudents(schoolId: string) {
  const snapshot = await getDocs(query(collection(firestore, schoolCollectionPath(schoolId, 'students')), limit(40)));

  return snapshot.docs.map((item) => mapStudent(item.id, item.data(), schoolId));
}

export async function listClasses(schoolId: string) {
  const snapshot = await getDocs(query(collection(firestore, schoolCollectionPath(schoolId, 'classes')), limit(40)));

  return snapshot.docs.map((item) => mapClass(item.id, item.data(), schoolId));
}

export function subscribeParentStudents(
  schoolId: string,
  parentId: string,
  onChange: (students: StudentProfile[]) => void,
  onError?: (error: Error) => void,
) {
  const parentReference = doc(firestore, schoolCollectionPath(schoolId, 'parents'), parentId);
  let studentUnsubscribe: (() => void) | null = null;

  const parentUnsubscribe = onSnapshot(
    parentReference,
    (parentSnapshot) => {
      const studentIds = parentSnapshot.exists()
        ? ((parentSnapshot.data().studentIds ?? []) as unknown[]).filter(
            (item): item is string => typeof item === 'string',
          )
        : [];

      if (studentUnsubscribe) {
        studentUnsubscribe();
        studentUnsubscribe = null;
      }

      if (studentIds.length === 0) {
        onChange([]);
        return;
      }

      const studentQuery = query(
        collection(firestore, schoolCollectionPath(schoolId, 'students')),
        where('__name__', 'in', studentIds.slice(0, 10)),
      );

      studentUnsubscribe = onSnapshot(
        studentQuery,
        (studentSnapshot) => {
          onChange(studentSnapshot.docs.map((item) => mapStudent(item.id, item.data(), schoolId)));
        },
        onError,
      );
    },
    onError,
  );

  return () => {
    parentUnsubscribe();
    if (studentUnsubscribe) {
      studentUnsubscribe();
    }
  };
}

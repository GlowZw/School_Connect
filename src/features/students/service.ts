import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type {
  ClassProfile,
  ClassInput,
  ParentStudentRelationship,
  StudentInput,
  StudentProfile,
} from '@/types/students';

function mapStudent(id: string, data: Record<string, unknown>, schoolId: string): StudentProfile {
  return {
    id,
    schoolId,
    fullName: String(data.fullName ?? data.name ?? 'Student'),
    grade: typeof data.grade === 'string' ? data.grade : undefined,
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
    classIds: Array.isArray(data.classIds)
      ? data.classIds.filter((item): item is string => typeof item === 'string')
      : [],
    className: typeof data.className === 'string' ? data.className : undefined,
    parentIds: Array.isArray(data.parentIds)
      ? data.parentIds.filter((item): item is string => typeof item === 'string')
      : [],
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
    subject: typeof data.subject === 'string' ? data.subject : undefined,
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
  const snapshot = await getDocs(
    query(collection(firestore, schoolCollectionPath(schoolId, 'students')), orderBy('fullName', 'asc'), limit(80)),
  );

  return snapshot.docs.map((item) => mapStudent(item.id, item.data(), schoolId));
}

export async function listClasses(schoolId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, schoolCollectionPath(schoolId, 'classes')), orderBy('name', 'asc'), limit(80)),
  );

  return snapshot.docs.map((item) => mapClass(item.id, item.data(), schoolId));
}

export async function listTeacherClasses(schoolId: string, teacherId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'classes')),
      where('teacherIds', 'array-contains', teacherId),
      orderBy('name', 'asc'),
      limit(80),
    ),
  );

  return snapshot.docs.map((item) => mapClass(item.id, item.data(), schoolId));
}

export async function createStudent(schoolId: string, input: StudentInput) {
  const reference = await addDoc(collection(firestore, schoolCollectionPath(schoolId, 'students')), {
    ...input,
    schoolId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reference.id;
}

export async function updateStudent(schoolId: string, studentId: string, input: StudentInput) {
  await updateDoc(doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId), {
    ...input,
    schoolId,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudent(schoolId: string, studentId: string) {
  await deleteDoc(doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId));
}

export async function upsertClass(schoolId: string, classId: string, input: ClassInput) {
  await setDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'classes'), classId),
    {
      ...input,
      schoolId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function assignTeacherToClass(
  schoolId: string,
  teacherId: string,
  input: ClassInput & { classId: string },
) {
  await upsertClass(schoolId, input.classId, {
    name: input.name,
    grade: input.grade,
    subject: input.subject,
    scheduleSummary: input.scheduleSummary,
    teacherIds: [teacherId],
  });

  await setDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'teachers'), teacherId),
    {
      schoolId,
      teacherId,
      assignmentIds: arrayUnion(input.classId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function searchStudents(schoolId: string, searchText: string) {
  const normalizedSearch = searchText.trim().toLowerCase();
  const students = await listSchoolStudents(schoolId);

  if (!normalizedSearch) {
    return students;
  }

  return students.filter((student) => student.fullName.toLowerCase().includes(normalizedSearch));
}

export async function linkParentToStudent(schoolId: string, parentId: string, studentId: string) {
  await setDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'parents'), parentId),
    {
      schoolId,
      parentId,
      studentIds: arrayUnion(studentId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId),
    {
      schoolId,
      parentIds: arrayUnion(parentId),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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

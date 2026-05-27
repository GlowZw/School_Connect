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
  TeacherOption,
} from '@/types/students';

function mapStudent(id: string, data: Record<string, unknown>, schoolId: string): StudentProfile {
  const classId = typeof data.classId === 'string' ? data.classId : undefined;
  const classIds = Array.isArray(data.classIds)
    ? data.classIds.filter((item): item is string => typeof item === 'string')
    : [];
  const normalizedClassIds =
    classId && !classIds.includes(classId) ? [classId, ...classIds] : classIds;

  return {
    id,
    schoolId,
    fullName: String(data.fullName ?? data.name ?? 'Student'),
    firstName: typeof data.firstName === 'string' ? data.firstName : undefined,
    surname:
      typeof data.surname === 'string'
        ? data.surname
        : typeof data.lastName === 'string'
          ? data.lastName
          : undefined,
    grade: typeof data.grade === 'string' ? data.grade : undefined,
    dob:
      typeof data.dob === 'string'
        ? data.dob
        : typeof data.dateOfBirth === 'string'
          ? data.dateOfBirth
          : undefined,
    gender:
      data.gender === 'Male' ||
      data.gender === 'Female' ||
      data.gender === 'Other' ||
      data.gender === 'Prefer not to say'
        ? data.gender
        : undefined,
    allergies: typeof data.allergies === 'string' ? data.allergies : undefined,
    medicalNotes: typeof data.medicalNotes === 'string' ? data.medicalNotes : undefined,
    emergencyContact: typeof data.emergencyContact === 'string' ? data.emergencyContact : undefined,
    relationshipToChild:
      typeof data.relationshipToChild === 'string' ? data.relationshipToChild : undefined,
    studentNumber: typeof data.studentNumber === 'string' ? data.studentNumber : undefined,
    additionalNotes: typeof data.additionalNotes === 'string' ? data.additionalNotes : undefined,
    parentName: typeof data.parentName === 'string' ? data.parentName : undefined,
    parentEmail: typeof data.parentEmail === 'string' ? data.parentEmail : undefined,
    parentPhone: typeof data.parentPhone === 'string' ? data.parentPhone : undefined,
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
    classId,
    classIds: normalizedClassIds,
    className: typeof data.className === 'string' ? data.className : undefined,
    parentIds: Array.isArray(data.parentIds)
      ? data.parentIds.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

function mapClass(id: string, data: Record<string, unknown>, schoolId: string): ClassProfile {
  const teacherId = typeof data.teacherId === 'string' ? data.teacherId : undefined;
  const teacherIds = Array.isArray(data.teacherIds)
    ? data.teacherIds.filter((item): item is string => typeof item === 'string')
    : [];
  const normalizedTeacherIds =
    teacherId && !teacherIds.includes(teacherId) ? [teacherId, ...teacherIds] : teacherIds;

  return {
    id,
    schoolId,
    name: String(data.name ?? data.className ?? data.title ?? id),
    grade: typeof data.grade === 'string' ? data.grade : undefined,
    teacherId,
    teacherIds: normalizedTeacherIds,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    scheduleSummary: typeof data.scheduleSummary === 'string' ? data.scheduleSummary : undefined,
  };
}

function mapTeacher(id: string, data: Record<string, unknown>): TeacherOption {
  const email = String(data.email ?? '');
  const name =
    typeof data.fullName === 'string' && data.fullName.trim()
      ? data.fullName.trim()
      : typeof data.displayName === 'string' && data.displayName.trim()
        ? data.displayName.trim()
        : email || 'Teacher';

  return {
    uid: typeof data.uid === 'string' && data.uid.trim() ? data.uid : id,
    name,
    email,
  };
}

export async function getParentRelationship(
  schoolId: string,
  parentId: string,
): Promise<ParentStudentRelationship> {
  const snapshot = await getDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'parents'), parentId),
  );

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
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'students')),
      orderBy('fullName', 'asc'),
      limit(80),
    ),
  );

  return snapshot.docs.map((item) => mapStudent(item.id, item.data(), schoolId));
}

export async function listClasses(schoolId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'classes')),
      orderBy('name', 'asc'),
      limit(80),
    ),
  );

  return snapshot.docs.map((item) => mapClass(item.id, item.data(), schoolId));
}

export async function listTeacherClasses(schoolId: string, teacherId: string) {
  const classesCollection = collection(firestore, schoolCollectionPath(schoolId, 'classes'));
  const [teacherIdSnapshot, teacherIdsSnapshot] = await Promise.all([
    getDocs(query(classesCollection, where('teacherId', '==', teacherId), limit(80))),
    getDocs(query(classesCollection, where('teacherIds', 'array-contains', teacherId), limit(80))),
  ]);

  const classes = [...teacherIdSnapshot.docs, ...teacherIdsSnapshot.docs]
    .filter((item, index, docs) => docs.findIndex((docItem) => docItem.id === item.id) === index)
    .map((item) => mapClass(item.id, item.data(), schoolId))
    .sort((first, second) => first.name.localeCompare(second.name));

  return classes;
}

export async function listStudentsByClassIds(schoolId: string, classIds: string[]) {
  const uniqueClassIds = [...new Set(classIds.filter(Boolean))];

  if (uniqueClassIds.length === 0) {
    return [];
  }

  const studentsCollection = collection(firestore, schoolCollectionPath(schoolId, 'students'));
  const chunks = Array.from({ length: Math.ceil(uniqueClassIds.length / 10) }, (_, index) =>
    uniqueClassIds.slice(index * 10, index * 10 + 10),
  );

  const snapshots = await Promise.all(
    chunks.flatMap((chunk) => [
      getDocs(query(studentsCollection, where('classId', 'in', chunk), limit(80))),
      ...chunk.map((classId) =>
        getDocs(query(studentsCollection, where('classIds', 'array-contains', classId), limit(80))),
      ),
    ]),
  );

  return snapshots
    .flatMap((snapshot) => snapshot.docs)
    .filter((item, index, docs) => docs.findIndex((docItem) => docItem.id === item.id) === index)
    .map((item) => mapStudent(item.id, item.data(), schoolId))
    .sort((first, second) => first.fullName.localeCompare(second.fullName));
}

export async function createStudent(schoolId: string, input: StudentInput) {
  const reference = await addDoc(
    collection(firestore, schoolCollectionPath(schoolId, 'students')),
    {
      ...input,
      classId: input.classId ?? input.classIds[0] ?? null,
      schoolId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  return reference.id;
}

export async function listSchoolTeachers(schoolId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'user_profiles'),
      where('schoolId', '==', schoolId),
      where('role', '==', 'teacher'),
      limit(80),
    ),
  );

  return snapshot.docs
    .map((item) => mapTeacher(item.id, item.data()))
    .sort((first, second) =>
      `${first.name} ${first.email}`.localeCompare(`${second.name} ${second.email}`),
    );
}

export async function updateStudent(schoolId: string, studentId: string, input: StudentInput) {
  await updateDoc(doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId), {
    ...input,
    classId: input.classId ?? input.classIds[0] ?? null,
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
  teacher: TeacherOption,
  input: Pick<ClassInput, 'name' | 'grade' | 'subject'>,
) {
  const classReference = await addDoc(
    collection(firestore, schoolCollectionPath(schoolId, 'classes')),
    {
      className: input.name,
      name: input.name,
      grade: input.grade,
      subject: input.subject,
      teacherId: teacher.uid,
      teacherEmail: teacher.email,
      teacherIds: [teacher.uid],
      schoolId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  await setDoc(
    classReference,
    {
      classId: classReference.id,
    },
    { merge: true },
  );

  await setDoc(
    doc(firestore, schoolCollectionPath(schoolId, 'teachers'), teacher.uid),
    {
      schoolId,
      teacherId: teacher.uid,
      teacherEmail: teacher.email,
      assignedClasses: arrayUnion(classReference.id),
      assignmentIds: arrayUnion(classReference.id),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return classReference.id;
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
  parentEmail: string | undefined,
  onChange: (students: StudentProfile[]) => void,
  onError?: (error: Error) => void,
) {
  const parentReference = doc(firestore, schoolCollectionPath(schoolId, 'parents'), parentId);
  let studentUnsubscribe: (() => void) | null = null;
  let relationshipStudents: StudentProfile[] = [];
  let parentIdStudents: StudentProfile[] = [];
  let parentEmailStudents: StudentProfile[] = [];

  const emitStudents = () => {
    onChange(
      [...relationshipStudents, ...parentIdStudents, ...parentEmailStudents].filter(
        (student, index, students) =>
          students.findIndex((item) => item.id === student.id) === index,
      ),
    );
  };

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
        relationshipStudents = [];
        emitStudents();
        return;
      }

      const studentQuery = query(
        collection(firestore, schoolCollectionPath(schoolId, 'students')),
        where('__name__', 'in', studentIds.slice(0, 10)),
      );

      studentUnsubscribe = onSnapshot(
        studentQuery,
        (studentSnapshot) => {
          relationshipStudents = studentSnapshot.docs.map((item) =>
            mapStudent(item.id, item.data(), schoolId),
          );
          emitStudents();
        },
        onError,
      );
    },
    onError,
  );

  const parentIdUnsubscribe = onSnapshot(
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'students')),
      where('parentIds', 'array-contains', parentId),
    ),
    (studentSnapshot) => {
      parentIdStudents = studentSnapshot.docs.map((item) =>
        mapStudent(item.id, item.data(), schoolId),
      );
      emitStudents();
    },
    onError,
  );

  const parentEmailUnsubscribe = parentEmail
    ? onSnapshot(
        query(
          collection(firestore, schoolCollectionPath(schoolId, 'students')),
          where('parentEmail', '==', parentEmail),
        ),
        (studentSnapshot) => {
          parentEmailStudents = studentSnapshot.docs.map((item) =>
            mapStudent(item.id, item.data(), schoolId),
          );
          emitStudents();
        },
        onError,
      )
    : undefined;

  return () => {
    parentUnsubscribe();
    parentIdUnsubscribe();
    parentEmailUnsubscribe?.();
    if (studentUnsubscribe) {
      studentUnsubscribe();
    }
  };
}

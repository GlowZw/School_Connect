import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { AttendanceInput, AttendanceRecord } from '@/types/attendance';

const PAGE_SIZE = 80;

function attendanceCollection(schoolId: string) {
  return collection(firestore, schoolCollectionPath(schoolId, 'attendance'));
}

function attendanceDocumentId(input: Pick<AttendanceInput, 'classId' | 'studentId' | 'date'>) {
  return `${input.classId}_${input.studentId}_${input.date}`;
}

function mapAttendanceRecord(id: string, data: Record<string, unknown>): AttendanceRecord {
  return {
    id,
    schoolId: String(data.schoolId),
    classId: String(data.classId),
    studentId: String(data.studentId),
    status: data.status as AttendanceRecord['status'],
    markedBy: String(data.markedBy ?? ''),
    date: String(data.date ?? ''),
    createdAt: data.createdAt as AttendanceRecord['createdAt'],
    updatedAt: data.updatedAt as AttendanceRecord['updatedAt'],
  };
}

export async function listAttendanceRecords(
  schoolId: string,
  options: { studentId?: string; classId?: string } = {},
) {
  const constraints = [orderBy('date', 'desc'), limit(PAGE_SIZE)];

  const scopedQuery = options.studentId
    ? query(attendanceCollection(schoolId), where('studentId', '==', options.studentId), ...constraints)
    : options.classId
      ? query(attendanceCollection(schoolId), where('classId', '==', options.classId), ...constraints)
      : query(attendanceCollection(schoolId), ...constraints);

  const snapshot = await getDocs(scopedQuery);

  return snapshot.docs.map((item) => mapAttendanceRecord(item.id, item.data()));
}

export function subscribeAttendanceRecords(
  schoolId: string,
  options: { studentId?: string; classId?: string },
  onChange: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void,
) {
  const constraints = [orderBy('date', 'desc'), limit(PAGE_SIZE)];
  const scopedQuery = options.studentId
    ? query(attendanceCollection(schoolId), where('studentId', '==', options.studentId), ...constraints)
    : options.classId
      ? query(attendanceCollection(schoolId), where('classId', '==', options.classId), ...constraints)
      : query(attendanceCollection(schoolId), ...constraints);

  return onSnapshot(
    scopedQuery,
    (snapshot) => onChange(snapshot.docs.map((item) => mapAttendanceRecord(item.id, item.data()))),
    onError,
  );
}

export async function markAttendance(input: AttendanceInput) {
  const reference = doc(
    firestore,
    schoolCollectionPath(input.schoolId, 'attendance'),
    attendanceDocumentId(input),
  );

  await setDoc(
    reference,
    {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function getAttendancePercentage(records: AttendanceRecord[]) {
  if (records.length === 0) {
    return 0;
  }

  const attended = records.filter(
    (record) => record.status === 'present' || record.status === 'late',
  ).length;

  return Math.round((attended / records.length) * 100);
}

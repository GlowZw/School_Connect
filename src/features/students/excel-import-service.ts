import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';

export type ExcelStudentRecord = {
  studentId: string;
  firstName: string;
  lastName: string;
  class: string;
  gender: string;
  dob: string;
  schoolId: string;
};

export type StudentImportResult = {
  created: number;
  skippedDuplicates: string[];
  errors: Array<{ studentId: string; message: string }>;
};

const MAX_BATCH_WRITES = 450;

export async function findExistingStudentIds(schoolId: string, studentIds: string[]) {
  const uniqueIds = Array.from(new Set(studentIds.filter(Boolean)));
  const existingIds = new Set<string>();

  for (let index = 0; index < uniqueIds.length; index += 25) {
    const chunk = uniqueIds.slice(index, index + 25);
    const snapshots = await Promise.all(
      chunk.map((studentId) =>
        getDoc(doc(firestore, schoolCollectionPath(schoolId, 'students'), studentId)),
      ),
    );

    snapshots.forEach((snapshot) => {
      if (snapshot.exists()) {
        existingIds.add(snapshot.id);
      }
    });
  }

  return existingIds;
}

export async function batchUploadStudents(
  schoolId: string,
  students: ExcelStudentRecord[],
  options?: {
    overwrite?: boolean;
    onProgress?: (percentage: number) => void;
  },
): Promise<StudentImportResult> {
  const overwrite = options?.overwrite ?? false;
  const existingIds = overwrite
    ? new Set<string>()
    : await findExistingStudentIds(
        schoolId,
        students.map((student) => student.studentId),
      );
  const importableStudents = students.filter((student) => !existingIds.has(student.studentId));
  const skippedDuplicates = students
    .filter((student) => existingIds.has(student.studentId))
    .map((student) => student.studentId);
  const errors: StudentImportResult['errors'] = [];
  let created = 0;

  for (let index = 0; index < importableStudents.length; index += MAX_BATCH_WRITES) {
    const chunk = importableStudents.slice(index, index + MAX_BATCH_WRITES);
    const batch = writeBatch(firestore);

    chunk.forEach((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.trim();
      const reference = doc(firestore, schoolCollectionPath(schoolId, 'students'), student.studentId);

      batch.set(
        reference,
        {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName,
          class: student.class,
          className: student.class,
          gender: student.gender,
          dob: student.dob,
          schoolId,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: overwrite },
      );
    });

    try {
      await batch.commit();
      created += chunk.length;
      options?.onProgress?.(Math.round((created / Math.max(importableStudents.length, 1)) * 100));
    } catch (error) {
      chunk.forEach((student) => {
        errors.push({
          studentId: student.studentId,
          message: error instanceof Error ? error.message : 'Failed to upload student.',
        });
      });
    }
  }

  if (importableStudents.length === 0) {
    options?.onProgress?.(100);
  }

  return {
    created,
    skippedDuplicates,
    errors,
  };
}

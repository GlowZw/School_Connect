import type { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AttendanceRecord = {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  markedBy: string;
  date: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type AttendanceInput = Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>;

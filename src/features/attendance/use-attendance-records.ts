import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listAttendanceRecords, subscribeAttendanceRecords } from '@/features/attendance/service';
import type { AttendanceRecord } from '@/types/attendance';

export function attendanceQueryKey(
  schoolId: string | null | undefined,
  options: { studentId?: string; classId?: string },
) {
  return ['attendance', schoolId, options.studentId ?? null, options.classId ?? null] as const;
}

export function useAttendanceRecords(
  schoolId: string | null | undefined,
  options: { studentId?: string; classId?: string } = {},
) {
  const queryClient = useQueryClient();
  const studentId = options.studentId;
  const classId = options.classId;
  const queryKey = attendanceQueryKey(schoolId, { studentId, classId });

  const query = useQuery({
    enabled: Boolean(schoolId),
    queryKey,
    queryFn: () => listAttendanceRecords(schoolId ?? '', { studentId, classId }),
  });

  useEffect(() => {
    if (!schoolId) {
      return undefined;
    }

    const unsubscribe = subscribeAttendanceRecords(schoolId, { studentId, classId }, (records) => {
      queryClient.setQueryData<AttendanceRecord[]>(
        attendanceQueryKey(schoolId, { studentId, classId }),
        records,
      );
    });

    return () => {
      unsubscribe();
    };
  }, [classId, queryClient, schoolId, studentId]);

  return query;
}

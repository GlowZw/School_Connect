import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listAttendanceRecords,
  subscribeAttendanceRecords,
} from '@/features/attendance/service';
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
  const queryKey = attendanceQueryKey(schoolId, options);

  const query = useQuery({
    enabled: Boolean(schoolId),
    queryKey,
    queryFn: () => listAttendanceRecords(schoolId ?? '', options),
  });

  useEffect(() => {
    if (!schoolId) {
      return undefined;
    }

    return subscribeAttendanceRecords(schoolId, options, (records) => {
      queryClient.setQueryData<AttendanceRecord[]>(queryKey, records);
    });
  }, [options, queryClient, queryKey, schoolId]);

  return query;
}

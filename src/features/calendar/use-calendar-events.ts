import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listCalendarEvents, subscribeCalendarEvents } from '@/features/calendar/service';
import type { CalendarEvent } from '@/types/calendar';

export function calendarEventsQueryKey(schoolId: string | null | undefined) {
  return ['calendar-events', schoolId] as const;
}

export function useCalendarEvents(schoolId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => calendarEventsQueryKey(schoolId), [schoolId]);

  const query = useQuery({
    enabled: Boolean(schoolId),
    queryKey,
    queryFn: () => listCalendarEvents(schoolId ?? ''),
  });

  useEffect(() => {
    if (!schoolId) {
      return undefined;
    }

    return subscribeCalendarEvents(schoolId, (events) => {
      queryClient.setQueryData<CalendarEvent[]>(queryKey, events);
    });
  }, [queryClient, queryKey, schoolId]);

  return query;
}

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { getFirebaseFunctions } from '@/services/firebase/functions';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { CalendarEvent, CalendarEventInput } from '@/types/calendar';

import { httpsCallable } from 'firebase/functions';

const PAGE_SIZE = 50;

function calendarCollection(schoolId: string) {
  return collection(firestore, schoolCollectionPath(schoolId, 'calendar'));
}

function mapCalendarEvent(id: string, data: Record<string, unknown>): CalendarEvent {
  const eventDate = data.eventDate as CalendarEvent['eventDate'];
  const fallbackDate = eventDate?.toDate ? eventDate.toDate() : new Date();
  const date = typeof data.date === 'string' ? data.date : fallbackDate.toISOString().slice(0, 10);
  const time =
    typeof data.time === 'string'
      ? data.time
      : fallbackDate.toTimeString().slice(0, 5);

  return {
    id,
    schoolId: String(data.schoolId),
    createdBy: String(data.createdBy),
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : undefined,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: data.category as CalendarEvent['category'],
    date,
    time,
    eventDate,
    reminderTimes: Array.isArray(data.reminderTimes)
      ? data.reminderTimes.filter((item): item is string => typeof item === 'string')
      : [],
    audience: Array.isArray(data.audience)
      ? data.audience.filter(
          (item): item is CalendarEvent['audience'][number] => typeof item === 'string',
        )
      : [],
    classIds: Array.isArray(data.classIds)
      ? data.classIds.filter((item): item is string => typeof item === 'string')
      : undefined,
    createdAt: data.createdAt as CalendarEvent['createdAt'],
    updatedAt: data.updatedAt as CalendarEvent['updatedAt'],
  };
}

export async function listCalendarEvents(schoolId: string): Promise<CalendarEvent[]> {
  const eventQuery = query(calendarCollection(schoolId), orderBy('eventDate', 'asc'), limit(PAGE_SIZE));
  const snapshot = await getDocs(eventQuery);

  return snapshot.docs.map((item) => mapCalendarEvent(item.id, item.data()));
}

export function subscribeCalendarEvents(
  schoolId: string,
  onChange: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void,
) {
  const eventQuery = query(calendarCollection(schoolId), orderBy('eventDate', 'asc'), limit(PAGE_SIZE));

  return onSnapshot(
    eventQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => mapCalendarEvent(item.id, item.data())));
    },
    onError,
  );
}

export async function createCalendarEvent(
  schoolId: string,
  createdBy: string,
  input: CalendarEventInput,
) {
  const reference = await addDoc(calendarCollection(schoolId), {
    ...input,
    schoolId,
    createdBy,
    eventDate: Timestamp.fromDate(new Date(`${input.date}T${input.time}:00`)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await scheduleCalendarReminders(schoolId, reference.id).catch(() => undefined);

  return reference.id;
}

export async function updateCalendarEvent(
  schoolId: string,
  eventId: string,
  input: Partial<CalendarEventInput>,
) {
  const updatePayload = {
    ...input,
    ...(input.date && input.time
      ? {
          eventDate: Timestamp.fromDate(
            new Date(`${input.date}T${input.time}:00`),
          ),
        }
      : {}),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(firestore, schoolCollectionPath(schoolId, 'calendar'), eventId), updatePayload);
  await scheduleCalendarReminders(schoolId, eventId).catch(() => undefined);
}

export async function deleteCalendarEvent(schoolId: string, eventId: string) {
  await deleteDoc(doc(firestore, schoolCollectionPath(schoolId, 'calendar'), eventId));
}

export async function scheduleCalendarReminders(schoolId: string, eventId: string) {
  const callable = httpsCallable(getFirebaseFunctions(), 'scheduleCalendarReminders');
  await callable({ schoolId, eventId });
}

export function getCalendarEventDateKey(event: CalendarEvent) {
  return event.date || event.eventDate.toDate().toISOString().slice(0, 10);
}

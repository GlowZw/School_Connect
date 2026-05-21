const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();

const db = getFirestore();

const reminderOffsets = {
  '1 day before': 24 * 60 * 60 * 1000,
  'Night before': 12 * 60 * 60 * 1000,
  '2 hours before': 2 * 60 * 60 * 1000,
};

function assertSchoolMember(request, schoolId) {
  if (!request.auth || request.auth.token.schoolId !== schoolId) {
    throw new HttpsError('permission-denied', 'School context is required.');
  }

  const role = request.auth.token.role;
  if (role !== 'teacher' && role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only teachers and admins can schedule reminders.');
  }
}

exports.scheduleCalendarReminders = onCall(async (request) => {
  const { schoolId, eventId } = request.data || {};

  if (typeof schoolId !== 'string' || typeof eventId !== 'string') {
    throw new HttpsError('invalid-argument', 'schoolId and eventId are required.');
  }

  assertSchoolMember(request, schoolId);

  const eventRef = db.doc(`schools/${schoolId}/calendar/${eventId}`);
  const eventSnapshot = await eventRef.get();

  if (!eventSnapshot.exists) {
    throw new HttpsError('not-found', 'Calendar event was not found.');
  }

  const event = eventSnapshot.data();
  const eventDate = event.eventDate.toDate();
  const batch = db.batch();

  for (const reminder of event.reminderTimes || []) {
    const offset = reminderOffsets[reminder];
    if (!offset) {
      continue;
    }

    const remindAt = new Date(eventDate.getTime() - offset);
    const reminderRef = db
      .collection(`schools/${schoolId}/calendar_reminders`)
      .doc(`${eventId}_${reminder.replace(/\s+/g, '_').toLowerCase()}`);

    batch.set(
      reminderRef,
      {
        schoolId,
        eventId,
        title: event.title,
        audience: event.audience || [],
        classIds: event.classIds || [],
        reminder,
        remindAt: Timestamp.fromDate(remindAt),
        delivered: false,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  return { scheduled: true };
});

exports.deliverCalendarReminders = onSchedule('every 30 minutes', async () => {
  const now = Timestamp.now();
  const schoolsSnapshot = await db.collection('schools_directory').get();

  for (const school of schoolsSnapshot.docs) {
    const schoolId = school.id;
    const reminders = await db
      .collection(`schools/${schoolId}/calendar_reminders`)
      .where('delivered', '==', false)
      .where('remindAt', '<=', now)
      .limit(50)
      .get();

    for (const reminderDoc of reminders.docs) {
      const reminder = reminderDoc.data();
      const tokensSnapshot = await db
        .collection(`schools/${schoolId}/notification_tokens`)
        .where('audiences', 'array-contains-any', reminder.audience.length ? reminder.audience : ['parents'])
        .limit(500)
        .get();

      const tokens = tokensSnapshot.docs
        .map((tokenDoc) => tokenDoc.data().token)
        .filter((token) => typeof token === 'string');

      if (tokens.length > 0) {
        await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'Calendar reminder',
            body: reminder.title,
          },
          data: {
            schoolId,
            eventId: reminder.eventId,
            category: 'events',
          },
        });
      }

      await reminderDoc.ref.set(
        {
          delivered: true,
          deliveredAt: Timestamp.now(),
        },
        { merge: true },
      );
    }
  }
});

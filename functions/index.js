const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const SCHOOL_NAME_MIGRATION = {
  oldName: ['Celebration International', 'College'].join(' '),
  newName: 'Celebration International School',
};

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

function assertAdmin(request) {
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can run this operation.');
  }
}

async function commitWhenFull(batchState, operations) {
  if (batchState.count < 450) {
    return;
  }

  await batchState.batch.commit();
  operations.commits += 1;
  batchState.batch = db.batch();
  batchState.count = 0;
}

async function updateSchoolNameQuery(collectionReference, label, operations) {
  const snapshot = await collectionReference
    .where('schoolName', '==', SCHOOL_NAME_MIGRATION.oldName)
    .get();

  const batchState = {
    batch: db.batch(),
    count: 0,
  };

  for (const documentSnapshot of snapshot.docs) {
    batchState.batch.update(documentSnapshot.ref, {
      schoolName: SCHOOL_NAME_MIGRATION.newName,
      updatedAt: Timestamp.now(),
    });
    batchState.count += 1;
    operations.updated += 1;
    operations.byCollection[label] = (operations.byCollection[label] || 0) + 1;
    await commitWhenFull(batchState, operations);
  }

  if (batchState.count > 0) {
    await batchState.batch.commit();
    operations.commits += 1;
  }
}

function getEventDate(event) {
  if (event.eventDate && typeof event.eventDate.toDate === 'function') {
    return event.eventDate.toDate();
  }

  if (typeof event.date === 'string') {
    return new Date(`${event.date}T${event.time || '09:00'}`);
  }

  return new Date();
}

function getNotificationCopy(event, isUpdate = false) {
  if (event.category === 'exam') {
    return {
      title: isUpdate ? 'Exam Schedule Updated' : 'New Exam Scheduled',
      body: event.title || 'A new exam has been added.',
    };
  }

  if (event.category === 'meeting') {
    return {
      title: isUpdate ? 'Parent Meeting Updated' : 'Parent Meeting Added',
      body: event.title || 'A parent meeting has been added.',
    };
  }

  if (event.category === 'assignment') {
    return {
      title: isUpdate ? 'Assignment Deadline Updated' : 'New Assignment Deadline',
      body: event.title || 'An assignment deadline has been updated.',
    };
  }

  return {
    title: isUpdate ? 'Calendar Event Updated' : 'New Calendar Event',
    body: event.title || 'A calendar event has been added.',
  };
}

async function getAudienceTokens(schoolId, audience) {
  const targetAudience = Array.isArray(audience) && audience.length > 0 ? audience : ['parents'];
  const snapshot = await db
    .collection(`schools/${schoolId}/notification_tokens`)
    .where('audiences', 'array-contains-any', targetAudience)
    .limit(500)
    .get();

  return snapshot.docs
    .map((tokenDoc) => ({
      ref: tokenDoc.ref,
      token: tokenDoc.data().token,
      tokenType: tokenDoc.data().tokenType,
    }))
    .filter((item) => typeof item.token === 'string' && item.tokenType === 'fcm');
}

async function sendMulticastWithRetry(message, attempts = 3) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await messaging.sendEachForMulticast(message);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError;
}

async function notifyCalendarAudience(schoolId, eventId, event, isUpdate = false) {
  const tokens = await getAudienceTokens(schoolId, event.audience);
  const copy = getNotificationCopy(event, isUpdate);
  const createdAt =
    event.createdAt && typeof event.createdAt.toDate === 'function'
      ? event.createdAt.toDate().toISOString()
      : new Date().toISOString();

  const notificationRef = db.collection(`schools/${schoolId}/notifications`).doc();
  await notificationRef.set({
    title: copy.title,
    body: copy.body,
    schoolId,
    eventId,
    type: event.category || 'events',
    createdAt: Timestamp.now(),
  });

  if (tokens.length === 0) {
    console.warn(`No Android FCM tokens found for calendar event ${eventId} in ${schoolId}.`);
    return;
  }

  for (let index = 0; index < tokens.length; index += 500) {
    const chunk = tokens.slice(index, index + 500);
    const response = await sendMulticastWithRetry({
      tokens: chunk.map((item) => item.token),
      notification: copy,
      data: {
        title: copy.title,
        body: copy.body,
        schoolId,
        eventId,
        type: event.category || 'events',
        createdAt,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'school-connect-default',
          sound: 'default',
        },
      },
    });

    const cleanup = [];
    response.responses.forEach((result, responseIndex) => {
      const code = result.error && result.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        cleanup.push(chunk[responseIndex].ref.delete());
      }
    });

    await Promise.all(cleanup);
  }
}

exports.notifyCalendarEventCreated = onDocumentCreated(
  'schools/{schoolId}/calendar/{eventId}',
  async (event) => {
    const data = event.data && event.data.data();
    if (!data) {
      return;
    }

    await notifyCalendarAudience(event.params.schoolId, event.params.eventId, data, false);
  },
);

exports.notifyCalendarEventUpdated = onDocumentUpdated(
  'schools/{schoolId}/calendar/{eventId}',
  async (event) => {
    const before = event.data && event.data.before.data();
    const after = event.data && event.data.after.data();
    if (!after) {
      return;
    }

    const meaningfulChange =
      !before ||
      before.title !== after.title ||
      before.description !== after.description ||
      before.category !== after.category ||
      before.date !== after.date ||
      before.time !== after.time ||
      String(before.eventDate && before.eventDate.toMillis && before.eventDate.toMillis()) !==
        String(after.eventDate && after.eventDate.toMillis && after.eventDate.toMillis());

    if (meaningfulChange) {
      await notifyCalendarAudience(event.params.schoolId, event.params.eventId, after, true);
    }
  },
);

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
  const eventDate = getEventDate(event);
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

exports.migrateSchoolName = onCall(async (request) => {
  assertAdmin(request);

  const operations = {
    updated: 0,
    commits: 0,
    byCollection: {},
  };

  await updateSchoolNameQuery(db.collection('user_profiles'), 'user_profiles', operations);
  await updateSchoolNameQuery(db.collection('schools_directory'), 'schools_directory', operations);

  const schoolsByName = await db
    .collection('schools_directory')
    .where('name', '==', SCHOOL_NAME_MIGRATION.oldName)
    .get();

  if (!schoolsByName.empty) {
    const batch = db.batch();
    schoolsByName.docs.forEach((schoolDoc) => {
      batch.update(schoolDoc.ref, {
        name: SCHOOL_NAME_MIGRATION.newName,
      });
      operations.updated += 1;
      operations.byCollection.schools_directory_name =
        (operations.byCollection.schools_directory_name || 0) + 1;
    });
    await batch.commit();
    operations.commits += 1;
  }

  for (const collectionId of [
    'students',
    'teachers',
    'parents',
    'attendance',
    'class_registers',
    'parent_child_links',
    'users',
  ]) {
    await updateSchoolNameQuery(db.collectionGroup(collectionId), collectionId, operations);
  }

  const verification = {
    remainingSchoolNameMatches: 0,
    remainingDirectoryNameMatches: 0,
  };

  const verifyUserProfiles = await db
    .collection('user_profiles')
    .where('schoolName', '==', SCHOOL_NAME_MIGRATION.oldName)
    .limit(1)
    .get();
  verification.remainingSchoolNameMatches += verifyUserProfiles.size;

  for (const collectionId of [
    'students',
    'teachers',
    'parents',
    'attendance',
    'class_registers',
    'parent_child_links',
    'users',
  ]) {
    const verifySnapshot = await db
      .collectionGroup(collectionId)
      .where('schoolName', '==', SCHOOL_NAME_MIGRATION.oldName)
      .limit(1)
      .get();
    verification.remainingSchoolNameMatches += verifySnapshot.size;
  }

  const verifyDirectory = await db
    .collection('schools_directory')
    .where('name', '==', SCHOOL_NAME_MIGRATION.oldName)
    .limit(1)
    .get();
  verification.remainingDirectoryNameMatches = verifyDirectory.size;

  return {
    oldName: SCHOOL_NAME_MIGRATION.oldName,
    newName: SCHOOL_NAME_MIGRATION.newName,
    ...operations,
    verification,
  };
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
      const tokenEntries = await getAudienceTokens(schoolId, reminder.audience);
      const tokens = tokenEntries.map((item) => item.token);

      if (tokens.length > 0) {
        await sendMulticastWithRetry({
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
          android: {
            priority: 'high',
            notification: {
              channelId: 'school-connect-default',
              sound: 'default',
            },
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

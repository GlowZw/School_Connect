import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';

import { logAnalyticsEvent } from '@/services/firebase/analytics';
import { firestore } from '@/services/firebase/firestore';
import { uploadSchoolMedia } from '@/services/media/media-service';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { Conversation, Message } from '@/features/messaging/types';

const messagePageSize = 25;

export function listenToConversations(
  schoolId: string,
  userId: string,
  onData: (conversations: Conversation[]) => void,
) {
  const conversationsQuery = query(
    collection(firestore, schoolCollectionPath(schoolId, 'conversations')),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(20),
  );

  return onSnapshot(conversationsQuery, (snapshot) => {
    onData(
      snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Conversation, 'id'>) })),
    );
  });
}

export function listenToMessages(
  schoolId: string,
  conversationId: string,
  onData: (messages: Message[]) => void,
) {
  const messagesQuery = query(
    collection(
      firestore,
      schoolCollectionPath(schoolId, 'conversations'),
      conversationId,
      'messages',
    ),
    orderBy('createdAt', 'desc'),
    limit(messagePageSize),
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    onData(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Message, 'id'>) })));
  });
}

export async function createConversation(
  schoolId: string,
  conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const reference = await addDoc(
    collection(firestore, schoolCollectionPath(schoolId, 'conversations')),
    {
      ...conversation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  return reference.id;
}

export async function sendMessage(
  schoolId: string,
  conversationId: string,
  message: Pick<Message, 'senderId' | 'content' | 'attachments'>,
) {
  const messageReference = collection(
    firestore,
    schoolCollectionPath(schoolId, 'conversations'),
    conversationId,
    'messages',
  );

  await addDoc(messageReference, {
    ...message,
    conversationId,
    readBy: [message.senderId],
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(firestore, schoolCollectionPath(schoolId, 'conversations'), conversationId), {
    updatedAt: serverTimestamp(),
    lastMessagePreview: message.content.slice(0, 120),
  });

  await logAnalyticsEvent('message_sent', {
    schoolId,
    conversationId,
    hasAttachments: Boolean(message.attachments?.length),
  });
}

export async function markConversationRead(
  schoolId: string,
  conversationId: string,
  messageId: string,
  userId: string,
) {
  await updateDoc(
    doc(
      firestore,
      schoolCollectionPath(schoolId, 'conversations'),
      conversationId,
      'messages',
      messageId,
    ),
    {
      readBy: arrayUnion(userId),
    },
  );
}

export async function setTypingIndicator(
  schoolId: string,
  conversationId: string,
  userId: string,
  isTyping: boolean,
) {
  await setDoc(
    doc(
      firestore,
      schoolCollectionPath(schoolId, 'conversations'),
      conversationId,
      'typing',
      'presence',
    ),
    {
      [userId]: isTyping,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function uploadMessageAttachment(
  schoolId: string,
  conversationId: string,
  fileName: string,
  blob: Blob,
  contentType: string,
) {
  return uploadSchoolMedia({
    schoolId,
    folder: `messages/${conversationId}`,
    fileName,
    blob,
    contentType,
  });
}

export const sampleConversations: Conversation[] = [
  {
    id: 'conv-1',
    schoolId: 'school-demo',
    type: 'direct',
    title: 'Mrs. Dube',
    participants: ['parent-1', 'teacher-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessagePreview: 'Homework feedback is ready for review.',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    schoolId: 'school-demo',
    type: 'group',
    title: 'Grade 6 Parents',
    participants: ['parent-1', 'teacher-1', 'admin-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessagePreview: 'Sports day transport times have been updated.',
    unreadCount: 0,
  },
];

export const sampleMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'teacher-1',
    conversationId: 'conv-1',
    content: 'Homework feedback is ready for review.',
    createdAt: new Date(),
    readBy: ['teacher-1', 'parent-1'],
  },
  {
    id: 'msg-2',
    senderId: 'parent-1',
    conversationId: 'conv-1',
    content: 'Thank you. I will review it this evening.',
    createdAt: new Date(),
    readBy: ['parent-1'],
  },
];

import type { Timestamp } from 'firebase/firestore';

export type ConversationType = 'direct' | 'group' | 'broadcast';

export type Conversation = {
  id: string;
  schoolId: string;
  type: ConversationType;
  title: string;
  participants: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastMessagePreview?: string;
  unreadCount?: number;
};

export type Message = {
  id: string;
  senderId: string;
  conversationId: string;
  content: string;
  attachments?: string[];
  createdAt: Timestamp | Date;
  readBy: string[];
};

export type TypingState = {
  userIds: string[];
  updatedAt: Timestamp | Date;
};

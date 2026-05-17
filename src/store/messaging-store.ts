import { create } from 'zustand';

type TypingMap = Record<string, string[]>;

type MessagingStore = {
  unreadByConversation: Record<string, number>;
  typingByConversation: TypingMap;
  setUnreadCount: (conversationId: string, count: number) => void;
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
};

export const useMessagingStore = create<MessagingStore>((set) => ({
  unreadByConversation: {},
  typingByConversation: {},
  setUnreadCount: (conversationId, count) =>
    set((state) => ({
      unreadByConversation: {
        ...state.unreadByConversation,
        [conversationId]: count,
      },
    })),
  setTypingUsers: (conversationId, userIds) =>
    set((state) => ({
      typingByConversation: {
        ...state.typingByConversation,
        [conversationId]: userIds,
      },
    })),
}));

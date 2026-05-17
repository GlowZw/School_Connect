import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Conversation } from '@/features/messaging/types';
import { theme } from '@/theme';

type ConversationListProps = {
  conversations: Conversation[];
};

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <View style={styles.wrapper}>
      <SectionHeading
        title="Messages"
        subtitle="Direct messages, class groups, and school broadcasts."
      />
      {conversations.map((conversation) => (
        <ListRow
          key={conversation.id}
          title={conversation.title}
          subtitle={conversation.lastMessagePreview ?? 'No messages yet.'}
          badge={
            conversation.unreadCount
              ? {
                  label: `${conversation.unreadCount} unread`,
                  tone: 'accent',
                }
              : {
                  label: conversation.type,
                }
          }
          meta={formatDate(conversation.updatedAt)}
        />
      ))}
      <View style={styles.footer}>
        <Chip label="Read receipts" tone="success" />
        <Chip label="Typing indicators" tone="accent" />
        <Chip label="Push alerts" tone="warning" />
      </View>
    </View>
  );
}

function formatDate(value: Conversation['updatedAt']) {
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});

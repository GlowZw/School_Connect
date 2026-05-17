import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Message } from '@/features/messaging/types';
import { theme } from '@/theme';

type ChatThreadProps = {
  title: string;
  messages: Message[];
  activeUserId: string;
};

export function ChatThread({ title, messages, activeUserId }: ChatThreadProps) {
  return (
    <View style={styles.wrapper}>
      <SectionHeading
        title={title}
        subtitle="Realtime thread with read receipts and attachments."
      />
      {messages.map((message) => {
        const ownMessage = message.senderId === activeUserId;

        return (
          <View key={message.id} style={[styles.row, ownMessage ? styles.rowOwn : null]}>
            <Card>
              <Text style={styles.message}>{message.content}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{formatDate(message.createdAt)}</Text>
                <Chip
                  label={message.readBy.length > 1 ? 'Read' : 'Sent'}
                  tone={message.readBy.length > 1 ? 'success' : 'neutral'}
                />
              </View>
            </Card>
          </View>
        );
      })}
      <Chip label="Typing: 1 participant" tone="accent" />
    </View>
  );
}

function formatDate(value: Message['createdAt']) {
  const date = value instanceof Date ? value : value.toDate();
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  row: {
    width: '86%',
  },
  rowOwn: {
    alignSelf: 'flex-end',
  },
  message: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
});

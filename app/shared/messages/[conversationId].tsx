import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { ChatThread } from '@/features/messaging/components/chat-thread';
import { sampleMessages } from '@/features/messaging/service';

export default function ConversationDetailScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const title = params.conversationId === 'conv-2' ? 'Grade 6 Parents' : 'Mrs. Dube';

  return (
    <Screen scrollable>
      <ChatThread activeUserId="parent-1" messages={sampleMessages} title={title} />
    </Screen>
  );
}

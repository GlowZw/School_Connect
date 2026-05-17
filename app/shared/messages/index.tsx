import { Screen } from '@/components/ui/screen';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { sampleConversations } from '@/features/messaging/service';

export default function MessagesScreen() {
  return (
    <Screen scrollable>
      <ConversationList conversations={sampleConversations} />
    </Screen>
  );
}

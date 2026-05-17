import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionTile } from '@/components/ui/action-tile';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { SectionHeading } from '@/components/ui/section-heading';
import { theme } from '@/theme';

export default function SharedRouteScreen() {
  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Shared Workspace"
        title="Cross-role collaboration"
        description="Shared routes host messaging and other experiences available to more than one tenant role."
      />
      <SectionHeading
        title="Shared Modules"
        subtitle="Start with the realtime messaging experience."
      />
      <View style={{ gap: theme.spacing.md }}>
        <ActionTile
          title="Open Messages"
          description="Conversation list, chat thread, attachments, and typing states."
          iconName="message-square"
          onPress={() => router.push('/shared/messages' as never)}
        />
      </View>
    </Screen>
  );
}

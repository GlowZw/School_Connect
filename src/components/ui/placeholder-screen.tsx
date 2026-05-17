import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { SectionHeading } from '@/components/ui/section-heading';
import { theme } from '@/theme';

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  highlights,
}: PlaceholderScreenProps) {
  return (
    <Screen scrollable>
      <PortalHero description={description} eyebrow={eyebrow} title={title} />
      <SectionHeading
        title="Overview"
        subtitle="This menu is now available from both the sidebar and the dashboard."
      />
      <View style={styles.list}>
        {highlights.map((highlight) => (
          <Card key={highlight}>
            <Text style={styles.item}>{highlight}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  item: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});

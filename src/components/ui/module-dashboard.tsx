import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ActionTile } from '@/components/ui/action-tile';
import { SectionHeading } from '@/components/ui/section-heading';
import type { NavigationItem } from '@/constants/navigation';
import { theme } from '@/theme';

type ModuleDashboardProps = {
  title: string;
  subtitle: string;
  modules: NavigationItem[];
  onNavigate: (href: string) => void;
};

export function ModuleDashboard({ title, subtitle, modules, onNavigate }: ModuleDashboardProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;

  return (
    <View style={styles.wrapper}>
      <SectionHeading title={title} subtitle={subtitle} />
      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        {modules.map((module) => (
          <View key={module.href} style={isWide ? styles.gridItemWide : null}>
            <ActionTile
              accent={module.accent}
              description={module.description}
              iconName={module.iconName}
              onPress={() => onNavigate(module.href)}
              title={module.label}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  grid: {
    gap: theme.spacing.md,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWide: {
    width: '48.5%',
  },
});

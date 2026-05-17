import { StyleSheet, View } from 'react-native';

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
  return (
    <View style={styles.wrapper}>
      <SectionHeading title={title} subtitle={subtitle} />
      <View style={styles.grid}>
        {modules.map((module) => (
          <ActionTile
            key={module.href}
            accent={module.accent}
            description={module.description}
            iconName={module.iconName}
            onPress={() => onNavigate(module.href)}
            title={module.label}
          />
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
});

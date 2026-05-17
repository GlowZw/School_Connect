import { View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { WeeklyMenu } from '@/features/lunch/types';
import { theme } from '@/theme';

type LunchOverviewProps = {
  menus: WeeklyMenu[];
};

export function LunchOverview({ menus }: LunchOverviewProps) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeading
        title="Lunch Menu"
        subtitle="Weekly meals, allergy notices, dietary notes, and schedule management."
      />
      {menus.flatMap((menu) =>
        menu.meals.map((meal) => (
          <ListRow
            key={meal.id}
            title={meal.title}
            subtitle={meal.description}
            meta={meal.dietaryNotes.join(' • ')}
            badge={{ label: formatDate(meal.date), tone: 'warning' }}
          />
        )),
      )}
    </View>
  );
}

function formatDate(value: WeeklyMenu['meals'][number]['date']) {
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

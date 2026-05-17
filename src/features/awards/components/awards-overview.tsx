import { View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { SectionHeading } from '@/components/ui/section-heading';
import type { StudentAward } from '@/features/awards/types';
import { theme } from '@/theme';

type AwardsOverviewProps = {
  awards: StudentAward[];
};

export function AwardsOverview({ awards }: AwardsOverviewProps) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeading
        title="Awards and Recognition"
        subtitle="Academic, sports, leadership, and certificate-based student recognition."
      />
      {awards.map((award) => (
        <ListRow
          key={award.id}
          title={award.title}
          subtitle={award.description}
          badge={{ label: award.category, tone: 'accent' }}
          meta={formatDate(award.awardedAt)}
        />
      ))}
    </View>
  );
}

function formatDate(value: StudentAward['awardedAt']) {
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString();
}

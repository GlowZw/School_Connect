import { Screen } from '@/components/ui/screen';
import { ActivityOverview } from '@/features/sports/components/activity-overview';
import { sampleActivityEvents, sampleTeams } from '@/features/sports/service';

export default function ParentActivitiesScreen() {
  return (
    <Screen scrollable>
      <ActivityOverview events={sampleActivityEvents} teams={sampleTeams} />
    </Screen>
  );
}

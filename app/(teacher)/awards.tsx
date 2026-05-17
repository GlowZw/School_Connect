import { Screen } from '@/components/ui/screen';
import { AwardsOverview } from '@/features/awards/components/awards-overview';
import { sampleAwards } from '@/features/awards/service';

export default function TeacherAwardsScreen() {
  return (
    <Screen scrollable>
      <AwardsOverview awards={sampleAwards} />
    </Screen>
  );
}

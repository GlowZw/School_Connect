import { Screen } from '@/components/ui/screen';
import { LunchOverview } from '@/features/lunch/components/lunch-overview';
import { sampleMenus } from '@/features/lunch/service';

export default function ParentLunchScreen() {
  return (
    <Screen scrollable>
      <LunchOverview menus={sampleMenus} />
    </Screen>
  );
}

import { router } from 'expo-router';

import { ModuleDashboard } from '@/components/ui/module-dashboard';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { roleNavigationItems } from '@/constants/navigation';

export default function AdminDashboardScreen() {
  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Admin Portal"
        title="Oversee Phase 2 operations"
        description="Broadcast school communication, manage payments, publish recognition, and control food and activity operations."
      />
      <ModuleDashboard
        modules={roleNavigationItems.admin.filter((item) => item.label !== 'Dashboard')}
        onNavigate={(href) => router.push(href as never)}
        subtitle="Home dashboard shortcuts that mirror the sidebar menu."
        title="Administration"
      />
    </Screen>
  );
}

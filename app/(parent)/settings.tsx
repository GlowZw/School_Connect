import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ParentSettingsScreen() {
  return (
    <PlaceholderScreen
      description="Manage parent profile preferences, account details, and portal behavior."
      eyebrow="Parent Portal"
      highlights={[
        'Profile and account preference access.',
        'Sidebar settings menu button added.',
        'Home dashboard shortcut icon added.',
      ]}
      title="Settings"
    />
  );
}

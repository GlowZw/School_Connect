import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function AdminSchoolsScreen() {
  return (
    <PlaceholderScreen
      description="Manage school tenant records, branding, logo, and theme metadata."
      eyebrow="Admin Portal"
      highlights={['School data remains isolated per tenant.', 'Branding loads from the selected school context.']}
      title="Schools"
    />
  );
}

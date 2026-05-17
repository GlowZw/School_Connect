import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      description="Open your account summary, profile information, and role-linked identity details."
      eyebrow="Shared Workspace"
      highlights={[
        'User profile and account summary.',
        'Shared profile access from the bottom navigation bar.',
        'Foundation for future editable account details.',
      ]}
      title="Profile"
    />
  );
}

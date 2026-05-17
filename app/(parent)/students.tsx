import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ParentStudentsScreen() {
  return (
    <PlaceholderScreen
      description="Access student-linked information for the children associated with your account."
      eyebrow="Parent Portal"
      highlights={[
        'Child profile summaries and related school information.',
        'A dedicated student entry point from the sidebar.',
        'Dashboard shortcut icon for faster access.',
      ]}
      title="Students"
    />
  );
}

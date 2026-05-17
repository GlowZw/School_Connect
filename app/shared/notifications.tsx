import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function NotificationsScreen() {
  return (
    <PlaceholderScreen
      description="Review announcements, fee alerts, message updates, awards, and school reminders."
      eyebrow="Shared Workspace"
      highlights={[
        'Message alerts and school reminders.',
        'Payment confirmations and award notifications.',
        'Notification center opened from the persistent bottom bar.',
      ]}
      title="Notifications"
    />
  );
}

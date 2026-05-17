import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ParentCalendarScreen() {
  return (
    <PlaceholderScreen
      description="Track upcoming school events, academic dates, and reminders linked to your child."
      eyebrow="Parent Portal"
      highlights={[
        'Upcoming school events and class reminders.',
        'Term dates, meetings, and activity schedules.',
        'A single calendar entry point from the sidebar and dashboard.',
      ]}
      title="Calendar"
    />
  );
}

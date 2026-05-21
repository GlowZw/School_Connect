import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function TeacherAssignmentsScreen() {
  return (
    <PlaceholderScreen
      description="Manage class assignments and assignment deadline calendar events."
      eyebrow="Teacher Portal"
      highlights={['Assignment deadlines appear in calendar.', 'Class visibility is tenant-aware.']}
      title="Assignments"
    />
  );
}

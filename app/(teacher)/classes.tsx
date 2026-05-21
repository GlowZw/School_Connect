import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function TeacherClassesScreen() {
  return (
    <PlaceholderScreen
      description="Review assigned classes and open attendance or student workflows."
      eyebrow="Teacher Portal"
      highlights={['Class visibility is tenant-scoped.', 'Attendance uses real-time Firestore updates.']}
      title="Classes"
    />
  );
}

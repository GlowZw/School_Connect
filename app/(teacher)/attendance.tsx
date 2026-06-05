import { Screen } from '@/components/ui/screen';
import { AttendanceWorkspace } from '@/features/attendance/components/attendance-workspace';
import { useLocalSearchParams } from 'expo-router';

export default function TeacherAttendanceScreen() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();

  return (
    <Screen scrollable>
      <AttendanceWorkspace initialClassId={classId} mode="teacher" />
    </Screen>
  );
}

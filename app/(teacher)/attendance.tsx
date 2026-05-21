import { Screen } from '@/components/ui/screen';
import { AttendanceWorkspace } from '@/features/attendance/components/attendance-workspace';

export default function TeacherAttendanceScreen() {
  return (
    <Screen scrollable>
      <AttendanceWorkspace mode="teacher" />
    </Screen>
  );
}

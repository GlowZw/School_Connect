import { Screen } from '@/components/ui/screen';
import { AttendanceWorkspace } from '@/features/attendance/components/attendance-workspace';

export default function AdminAttendanceScreen() {
  return (
    <Screen scrollable>
      <AttendanceWorkspace mode="admin" />
    </Screen>
  );
}

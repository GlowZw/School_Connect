import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ModuleDashboard } from '@/components/ui/module-dashboard';
import { PortalHero } from '@/components/ui/portal-hero';
import { Screen } from '@/components/ui/screen';
import { roleNavigationItems } from '@/constants/navigation';
import { listStudentsByClassIds, listTeacherClasses } from '@/features/students/service';
import { useAuthStore } from '@/store/auth-store';

export default function TeacherDashboardScreen() {
  const profile = useAuthStore((state) => state.profile);
  const schoolId = profile?.schoolId;
  const teacherId = profile?.uid;

  const classesQuery = useQuery({
    enabled: Boolean(schoolId && teacherId),
    queryKey: ['teacher-classes', schoolId, teacherId],
    queryFn: () => listTeacherClasses(schoolId ?? '', teacherId ?? ''),
    staleTime: 60_000,
  });

  const classes = classesQuery.data ?? [];
  const classIds = useMemo(() => classes.map((schoolClass) => schoolClass.id), [classes]);

  const studentsQuery = useQuery({
    enabled: Boolean(schoolId && teacherId && classIds.length > 0),
    queryKey: ['teacher-students', schoolId, teacherId, classIds],
    queryFn: () => listStudentsByClassIds(schoolId ?? '', classIds),
    staleTime: 60_000,
  });

  const teacherModules = useMemo(
    () =>
      roleNavigationItems.teacher
        .filter((item) => item.label !== 'Dashboard')
        .map((item) => {
          if (item.label === 'Classes') {
            return {
              ...item,
              description: `Assigned classes: ${classes.length}`,
            };
          }

          if (item.label === 'Students') {
            return {
              ...item,
              description: `Assigned students: ${(studentsQuery.data ?? []).length}`,
            };
          }

          return item;
        }),
    [classes.length, studentsQuery.data],
  );

  return (
    <Screen scrollable>
      <PortalHero
        eyebrow="Teacher Portal"
        title="Manage communication and activities"
        description="Coordinate parent messaging, sports and culture updates, awards, and operational alerts."
      />
      <View>
        <ModuleDashboard
          modules={teacherModules}
          onNavigate={(href) => router.push(href as never)}
          subtitle="Dashboard icons for the same modules available in the sidebar."
          title="Teaching Workflow"
        />
      </View>
    </Screen>
  );
}

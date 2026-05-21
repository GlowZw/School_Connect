import type { AppIconName } from '@/components/ui/app-icon';
import { theme } from '@/theme';
import type { UserRole } from '@/types/auth';

export type NavigationItem = {
  label: string;
  href: string;
  iconName: AppIconName;
  accent: string;
  description: string;
};

export const roleNavigationItems: Record<UserRole | 'shared', NavigationItem[]> = {
  parent: [
    {
      label: 'Dashboard',
      href: '/(parent)',
      iconName: 'home',
      accent: theme.colors.primary,
      description: 'Return to the parent home dashboard.',
    },
    {
      label: 'My Kids',
      href: '/(parent)/students',
      iconName: 'users',
      accent: theme.colors.accent,
      description: 'View children, classes, attendance, schedules, and school updates.',
    },
    {
      label: 'Attendance',
      href: '/(parent)/attendance',
      iconName: 'check-square',
      accent: theme.colors.success,
      description: 'Review linked child attendance records.',
    },
    {
      label: 'Calendar',
      href: '/(parent)/calendar',
      iconName: 'calendar',
      accent: theme.colors.secondary,
      description: 'Browse school events, reminders, and term dates.',
    },
    {
      label: 'Fees',
      href: '/(parent)/payments',
      iconName: 'dollar-sign',
      accent: theme.colors.success,
      description: 'Track balances, due dates, and payment history.',
    },
    {
      label: 'Notifications',
      href: '/shared/notifications',
      iconName: 'bell',
      accent: theme.colors.warning,
      description: 'Review reminders, alerts, and school notifications.',
    },
    {
      label: 'Teacher Communication',
      href: '/shared/messages',
      iconName: 'message-square',
      accent: theme.colors.primary,
      description: 'Open direct chats, group threads, and announcements.',
    },
    {
      label: 'Activities',
      href: '/(parent)/activities',
      iconName: 'activity',
      accent: theme.colors.accent,
      description: 'See sports, culture events, participation, and updates.',
    },
    {
      label: 'Awards',
      href: '/(parent)/awards',
      iconName: 'file-text',
      accent: theme.colors.warning,
      description: 'View student recognition and achievement records.',
    },
    {
      label: 'Lunch Menu',
      href: '/(parent)/lunch',
      iconName: 'coffee',
      accent: theme.colors.secondary,
      description: 'Browse meals, dietary notes, and weekly menus.',
    },
    {
      label: 'Settings',
      href: '/(parent)/settings',
      iconName: 'settings',
      accent: theme.colors.warning,
      description: 'Manage account preferences and profile details.',
    },
  ],
  teacher: [
    {
      label: 'Dashboard',
      href: '/(teacher)',
      iconName: 'home',
      accent: theme.colors.primary,
      description: 'Return to the teacher home dashboard.',
    },
    {
      label: 'Classes',
      href: '/(teacher)/classes',
      iconName: 'users',
      accent: theme.colors.accent,
      description: 'Access assigned classes and class-level workflows.',
    },
    {
      label: 'Attendance',
      href: '/(teacher)/attendance',
      iconName: 'check-square',
      accent: theme.colors.success,
      description: 'Mark class attendance in real time.',
    },
    {
      label: 'Calendar',
      href: '/(teacher)/calendar',
      iconName: 'calendar',
      accent: theme.colors.secondary,
      description: 'Review teaching schedules, events, and school dates.',
    },

    {
      label: 'Announcements',
      href: '/(teacher)/announcements',
      iconName: 'volume-2',
      accent: theme.colors.primary,
      description: 'Publish class and school announcements.',
    },
    {
      label: 'Students',
      href: '/(teacher)/students',
      iconName: 'users',
      accent: theme.colors.accent,
      description: 'Access class lists and student-related records.',
    },
    {
      label: 'Assignments',
      href: '/(teacher)/assignments',
      iconName: 'file-text',
      accent: theme.colors.warning,
      description: 'Manage assignments and deadline visibility.',
    },
    {
      label: 'Notifications',
      href: '/shared/notifications',
      iconName: 'bell',
      accent: theme.colors.warning,
      description: 'Review reminders and school alerts.',
    },
    {
      label: 'Sports & Culture',
      href: '/(teacher)/activities',
      iconName: 'activity',
      accent: theme.colors.accent,
      description: 'Manage sports and culture activity updates.',
    },
    {
      label: 'Settings',
      href: '/(teacher)/settings',
      iconName: 'settings',
      accent: theme.colors.warning,
      description: 'Manage portal preferences and account details.',
    },
  ],
  admin: [
    {
      label: 'Dashboard',
      href: '/(admin)',
      iconName: 'home',
      accent: theme.colors.primary,
      description: 'Return to the admin home dashboard.',
    },
    {
      label: 'Schools',
      href: '/(admin)/schools',
      iconName: 'map-pin',
      accent: theme.colors.primary,
      description: 'Manage tenant school records and branding metadata.',
    },
    {
      label: 'Attendance',
      href: '/(admin)/attendance',
      iconName: 'check-square',
      accent: theme.colors.success,
      description: 'Review attendance analytics and class registers.',
    },
    {
      label: 'Events',
      href: '/(admin)/calendar',
      iconName: 'calendar',
      accent: theme.colors.secondary,
      description: 'Control events, school schedules, and reminders.',
    },
    {
      label: 'Teachers',
      href: '/(admin)/settings',
      iconName: 'briefcase',
      accent: theme.colors.accent,
      description: 'Manage teacher access and operational assignments.',
    },
    {
      label: 'Students',
      href: '/(admin)/students',
      iconName: 'users',
      accent: theme.colors.accent,
      description: 'Manage student records and enrollment operations.',
    },
    {
      label: 'Fees',
      href: '/(admin)/payments',
      iconName: 'dollar-sign',
      accent: theme.colors.success,
      description: 'Monitor fee structures, balances, and payment reports.',
    },
    {
      label: 'Messages',
      href: '/shared/messages',
      iconName: 'message-square',
      accent: theme.colors.primary,
      description: 'Broadcast messages and review communication activity.',
    },
    {
      label: 'Activities',
      href: '/(admin)/activities',
      iconName: 'activity',
      accent: theme.colors.accent,
      description: 'Manage sports, culture events, and participation.',
    },
    {
      label: 'Awards',
      href: '/(admin)/awards',
      iconName: 'file-text',
      accent: theme.colors.warning,
      description: 'Issue student recognition and certificate updates.',
    },
    {
      label: 'Lunch Menu',
      href: '/(admin)/lunch',
      iconName: 'coffee',
      accent: theme.colors.secondary,
      description: 'Publish weekly menus and dietary notices.',
    },
    {
      label: 'Settings',
      href: '/(admin)/settings',
      iconName: 'settings',
      accent: theme.colors.warning,
      description: 'Configure portal and account-level settings.',
    },
  ],
  shared: [
    {
      label: 'Messages',
      href: '/shared/messages',
      iconName: 'message-square',
      accent: theme.colors.primary,
      description: 'Open the shared messaging workspace.',
    },
  ],
};

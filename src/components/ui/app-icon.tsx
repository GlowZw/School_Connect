import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

import { theme } from '@/theme';

export type AppIconName = ComponentProps<typeof Feather>['name'];

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 20, color = theme.colors.surface }: AppIconProps) {
  return <Feather color={color} name={name} size={size} />;
}

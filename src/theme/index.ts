import { palette } from '@/constants/theme';

export const theme = {
  colors: palette,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
  },
  shadow: {
    card: {
      shadowColor: '#172033',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 2,
    },
  },
};

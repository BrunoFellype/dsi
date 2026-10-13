import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#3873A0',
    header: '#9AD9EB',
    background: '#FDFFFF',
    backgroundCard: '#E5F4F8',
    cardBorder: '#D4EBF3',
    inputBorder: '#9AD9EB',
    text: '#1D2A44',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    link: '#0059FF',
    error: '#D32F2F',
    success: '#10B981',
    warning: '#F59E0B',
    white: '#FFFFFF',
    borderLight: '#E2E8F0',
  },
  dark: {
    primary: '#6EA1C5',
    header: '#2A4B7C',
    background: '#0B132B',
    backgroundCard: '#1C2541',
    cardBorder: '#3A506B',
    inputBorder: '#41689E',
    text: '#FFFFFF',
    textSecondary: '#C9F7FF',
    textMuted: '#8A99AD',
    link: '#9AD9EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    white: '#FFFFFF',
    borderLight: '#2A4B7C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

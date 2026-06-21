import { Platform } from 'react-native';

export const Spacing = { half: 4, one: 8, two: 12, three: 16, four: 24, five: 32 };
export const MaxContentWidth = 768;
export const Fonts = { mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string };

const lightTheme = {
  background: '#f9fafb',
  backgroundElement: '#f3f4f6',
  backgroundSelected: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
};
const darkTheme = {
  background: '#111827',
  backgroundElement: '#1f2937',
  backgroundSelected: '#374151',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
};
export const Colors = { light: lightTheme, dark: darkTheme };
export type ThemeColor = keyof typeof lightTheme;

export const COLORS = {
  primary: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  bg: '#f9fafb',
  surface: '#ffffff',
  surface2: '#f3f4f6',
  surface3: '#e5e7eb',
  text: '#111827',
  text2: '#374151',
  text3: '#6b7280',
  text4: '#9ca3af',
  border: '#e5e7eb',
};

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };

export const SHADOW = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  primary: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
};

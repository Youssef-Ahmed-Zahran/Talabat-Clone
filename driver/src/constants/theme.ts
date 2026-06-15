// ============================================================
// Design Tokens — keep in sync with tailwind.config.js
// ============================================================

export const COLORS = {
  primary: '#FF5A00',
  primaryLight: '#FF7A2E',
  primaryDark: '#E04E00',
  primarySoft: '#FFF0E6',

  secondary: '#1A1A2E',
  secondaryLight: '#2D2D44',

  success: '#22C55E',
  successLight: '#DCFCE7',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  white: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  border: '#E8E8E8',
  background: '#F5F5F5',
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

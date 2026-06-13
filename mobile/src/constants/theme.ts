// ============================================================
// Talabat Theme — Orange & White like the real Talabat app
// ============================================================

export const COLORS = {
  // Primary orange palette
  primary: '#FF5A00',
  primaryLight: '#FF7A2E',
  primaryDark: '#E04E00',
  primarySoft: '#FFF0E6',

  // Secondary
  secondary: '#1A1A2E',
  secondaryLight: '#2D2D44',

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#FF5A00',

  // Status
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Map
  mapMarker: '#FF5A00',
  mapRoute: '#3B82F6',

  // Rating
  star: '#F59E0B',
  starEmpty: '#D1D5DB',

  // Skeleton
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  // Tab bar
  tabActive: '#FF5A00',
  tabInactive: '#9CA3AF',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  hero: 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

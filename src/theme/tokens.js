/**
 * Stepora Mobile Design Tokens
 * Dark glass morphism theme matching the web app.
 * Synced with /root/stepora-frontend/src/theme/tokens.js
 */

var COLORS = {
  // Brand
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#6D28D9',
  pink: '#EC4899',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#FCD34D',
  teal: '#14B8A6',
  blue: '#3B82F6',
  indigo: '#6366F1',
  white: '#FFFFFF',

  // Text
  text: '#F8FAFC',
  textPrimary: '#F8FAFC',
  textSecondary: 'rgba(248,250,252,0.7)',
  textMuted: 'rgba(248,250,252,0.45)',
  textTertiary: 'rgba(248,250,252,0.55)',

  // Glass
  glassBg: 'rgba(255,255,255,0.06)',
  glassBgHover: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderLight: 'rgba(255,255,255,0.12)',

  // Backgrounds
  bodyBg: '#0B0F1A',
  cardBg: 'rgba(255,255,255,0.04)',
  divider: 'rgba(255,255,255,0.08)',
  accent: '#8B5CF6',
  accentSoft: 'rgba(139,92,246,0.15)',

  // Status
  online: '#22C55E',
  offline: 'rgba(248,250,252,0.3)',
};

var GRADIENTS = {
  primary: ['#8B5CF6', '#6D28D9'],
  purplePink: ['#8B5CF6', '#EC4899'],
  greenTeal: ['#22C55E', '#14B8A6'],
};

var CONTACT_COLORS = [
  '#8B5CF6', '#14B8A6', '#EC4899', '#3B82F6',
  '#10B981', '#FCD34D', '#6366F1', '#EF4444',
  '#F59E0B', '#A78BFA', '#34D399', '#F472B6',
];

// React Native uses system font weights via fontWeight style prop.
// These map conceptually to the web's font families.
var FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

var FONT_SIZES = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

var FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

var LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

var SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

var RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  full: 9999,
};

var Z = {
  base: 1,
  sticky: 10,
  fab: 80,
  nav: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  call: 500,
  splash: 600,
};

// Glass morphism tokens adapted for React Native.
// RN does not support CSS vars, so values are inlined.
var GLASS = {
  blur: 40,
  saturate: 1.3,
  bg: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  hoverBg: 'rgba(255,255,255,0.1)',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
};

module.exports = {
  COLORS: COLORS,
  GRADIENTS: GRADIENTS,
  CONTACT_COLORS: CONTACT_COLORS,
  FONTS: FONTS,
  FONT_SIZES: FONT_SIZES,
  FONT_WEIGHTS: FONT_WEIGHTS,
  LINE_HEIGHTS: LINE_HEIGHTS,
  SPACING: SPACING,
  RADIUS: RADIUS,
  Z: Z,
  GLASS: GLASS,
};

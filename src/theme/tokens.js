/**
 * Stepora Mobile Design Tokens
 * Dark glass morphism theme matching the web app.
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

var FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

var SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

var RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

module.exports = {
  COLORS: COLORS,
  GRADIENTS: GRADIENTS,
  CONTACT_COLORS: CONTACT_COLORS,
  FONTS: FONTS,
  SPACING: SPACING,
  RADIUS: RADIUS,
};

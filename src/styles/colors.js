/**
 * Stepora Mobile — Centralized Color Definitions
 * Mirrors the web app's styles/colors.js for React Native.
 */

var BRAND = {
  purple: '#8B5CF6',
  purpleLight: '#C4B5FD',
  purpleDark: '#7C3AED',
  purpleDeep: '#6D28D9',
  teal: '#14B8A6',
  tealLight: '#5EEAD4',
  tealDark: '#0D9488',
  green: '#5DE5A8',
  greenSolid: '#10B981',
  greenDark: '#059669',
  greenAction: '#22C55E',
  red: '#F69A9A',
  redSolid: '#EF4444',
  redDark: '#DC2626',
  yellow: '#FCD34D',
  yellowDark: '#B45309',
  pink: '#EC4899',
  indigo: '#6366F1',
  indigoDark: '#4338CA',
  blue: '#3B82F6',
  blueDark: '#2563EB',
  blueLight: '#93C5FD',
  orange: '#F59E0B',
  white: '#ffffff',
  black: '#000000',
  bgDeep: '#03010a',
  bgDark: '#070412',
  bgMid: '#0c081a',
};

var CATEGORIES = {
  career: { dark: '#C4B5FD', light: '#6D28D9', solid: '#8B5CF6', label: 'Career' },
  hobbies: { dark: '#EC4899', light: '#BE185D', solid: '#EC4899', label: 'Hobbies' },
  health: { dark: '#5DE5A8', light: '#059669', solid: '#10B981', label: 'Health' },
  finance: { dark: '#FCD34D', light: '#B45309', solid: '#FCD34D', label: 'Finance' },
  personal: { dark: '#6366F1', light: '#4338CA', solid: '#6366F1', label: 'Growth' },
  relationships: { dark: '#5EEAD4', light: '#0D9488', solid: '#14B8A6', label: 'Social' },
};

var GRADIENTS = {
  primary: ['#8B5CF6', '#7C3AED'],
  xp: ['#8B5CF6', '#C4B5FD'],
  success: ['#5DE5A8', '#10B981'],
};

var STATUS = {
  active: '#5DE5A8',
  completed: '#8B5CF6',
  paused: '#FCD34D',
  archived: '#9CA3AF',
};

var LIGHT_MAP = {
  '#C4B5FD': '#6D28D9',
  '#5DE5A8': '#059669',
  '#FCD34D': '#B45309',
  '#F69A9A': '#DC2626',
  '#5EEAD4': '#0D9488',
  '#EC4899': '#BE185D',
  '#93C5FD': '#2563EB',
  '#6366F1': '#4338CA',
  '#8B5CF6': '#7C3AED',
  '#9CA3AF': '#4B5563',
};

function adaptColor(darkColor, isLight) {
  if (!isLight) return darkColor;
  return LIGHT_MAP[darkColor] || darkColor;
}

function catColor(key, isLight) {
  var cat = CATEGORIES[key];
  if (!cat) return isLight ? '#6D28D9' : '#C4B5FD';
  return isLight ? cat.light : cat.dark;
}

function catSolid(key) {
  var cat = CATEGORIES[key];
  return cat ? cat.solid : '#8B5CF6';
}

module.exports = {
  BRAND: BRAND,
  CATEGORIES: CATEGORIES,
  GRADIENTS: GRADIENTS,
  STATUS: STATUS,
  LIGHT_MAP: LIGHT_MAP,
  adaptColor: adaptColor,
  catColor: catColor,
  catSolid: catSolid,
};

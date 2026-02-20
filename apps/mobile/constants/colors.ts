export const Colors = {
  light: {
    bg: '#F2F2F7', // iOS Grouped Background
    surface: '#FFFFFF', // Pure white cards
    primary: '#000000', // Pure black text
    secondary: '#8E8E93', // iOS System Gray
    accent: '#059669', // Deep calm Emerald Green (Health-focused but easy on eyes)
    accentSoft: 'rgba(5, 150, 105, 0.15)', // Soft emerald tint
    error: '#FF3B30', // iOS System Red (Light)
    warning: '#FF9500', // iOS System Orange (Light)
    border: '#C6C6C8', // iOS Separator (Light)
    shadow: '#000000',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    bg: '#050D0A', // Ultra-dark green/black (feels like a deep forest shadow)
    surface: '#0A1C14', // Rich, deep dark green for elevated cards
    primary: '#FFFFFF', // Pure White text
    secondary: '#88A396', // Pale sage green for muted elegant text
    accent: '#10B981', // Luminous but soft Emerald Green (Not piercing like neon)
    accentSoft: 'rgba(16, 185, 129, 0.15)', // Soft emerald for subtle badges/tinting
    error: '#FF453A', // iOS System Red (Dark)
    warning: '#FF9F0A', // iOS System Orange (Dark)
    border: '#153625', // Subtle dark green border separators
    shadow: '#000000',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.65)',
  },
};

export type ThemeColors = typeof Colors.light;

export const SHADOWS = {
  small: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

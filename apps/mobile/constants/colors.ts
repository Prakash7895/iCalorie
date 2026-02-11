export const COLORS = {
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#2D3436', // Dark elegant text
  secondary: '#636E72', // Muted text
  accent: '#00B894', // Minty fresh
  accentSoft: '#E0F2F1', // Light mint
  error: '#FF7675',
  warning: '#FDCB6E',
  border: '#DFE6E9',
  shadow: '#2D3436',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

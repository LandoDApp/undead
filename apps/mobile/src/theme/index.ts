import { StyleSheet } from 'react-native';

export const colors = {
  // Backgrounds
  background: '#0d1117',      // Deep night blue
  surface: '#1c2333',          // Dark panel
  surfaceLight: '#2d3548',     // Lighter panel
  parchment: '#3d3428',        // Parchment brown
  parchmentLight: '#4a3f30',   // Lighter parchment

  // Clan colors
  clanGlut: '#c0392b',         // Red (Flame)
  clanFrost: '#2980b9',        // Blue (Ice)
  clanHain: '#27ae60',         // Green (Oak)

  // Accents
  gold: '#f1c40f',             // Gold highlight
  goldDark: '#d4a80a',         // Darker gold

  // Functional
  primary: '#27ae60',
  primaryDark: '#1e8449',
  danger: '#c0392b',
  dangerDark: '#922b21',
  warning: '#e67e22',
  success: '#2ecc71',
  disabled: '#4a5568',

  // Text
  text: '#e8e6e3',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Game objects
  ghoul: '#8b0000',            // Dark red
  cityState: '#27ae60',        // Green
  cityStateFallen: '#c0392b',  // Red
  player: '#3498db',           // Blue
  resource: '#f1c40f',         // Gold

  // Other
  border: '#2d3548',
  night: '#080c14',
} as const;

export const fontFamily = {
  heading: 'PressStart2P',
  body: 'm6x11',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  goldGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

export const fantasyCard = StyleSheet.create({
  card: {
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.gold + '40',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gold + '50',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

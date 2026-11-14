import { Platform } from "react-native";

/**
 * Kaggri-Trade Design System Tokens
 * Synchronized with Kaggri-Trade/fe/src/styles.css (Warm Organic Editorial B2B Theme)
 * Preserves legacy token names for compatibility across all existing vovu screens.
 */

export const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

export const colors = {
  // Explicit Kaggri-Trade tokens
  bg: "#fafbf8",
  panel: "#ffffff",
  cream: "#f1f2e8",
  filterBox: "#f0f2eb",
  filterBorder: "#e9ecdf",
  green: "#24583f",
  greenHover: "#2d6a4c",
  greenSoft: "#edf2e5",
  greenAccent: "#466c40",
  dark: "#173d2c",
  text: "#263b30",
  muted: "#788278",
  eyebrow: "#667957",
  line: "#e4e8df",
  inputBorder: "#dce2d7",
  amber: "#a77332",
  danger: "#aa493f",

  // Kaggri Badge tones
  badgeGreenBg: "#eaf1e6",
  badgeGreenText: "#497247",
  badgeRedBg: "#f9ebe6",
  badgeRedText: "#b3604c",
  badgeGrayBg: "#edf0eb",
  badgeGrayText: "#7c847a",
  badgeAmberBg: "#f9f0dd",
  badgeAmberText: "#a17a31",

  // Primary (Forest Green #24583f)
  primary: "#24583f",
  primaryContainer: "#24583f",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#24583f",
  primaryFixed: "#eaf1e6",
  primaryFixedDim: "#cde0c5",
  onPrimaryFixed: "#173d2c",
  onPrimaryFixedVariant: "#24583f",
  inversePrimary: "#cde0c5",

  // Secondary (Warm Harvest Amber #a77332)
  secondary: "#a77332",
  secondaryContainer: "#f9f0dd",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#7c531e",
  secondaryFixed: "#f9f0dd",
  secondaryFixedDim: "#ebd8b2",
  onSecondaryFixed: "#5c3c12",
  onSecondaryFixedVariant: "#a17a31",

  // Tertiary (Olive Sage)
  tertiary: "#466c40",
  tertiaryContainer: "#edf2e5",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#24583f",
  tertiaryFixed: "#eaf1e6",
  tertiaryFixedDim: "#c8d8be",
  onTertiaryFixed: "#173d2c",
  onTertiaryFixedVariant: "#497247",

  // Surface hierarchy (Kaggri warm cream & crisp white panels)
  surface: "#fafbf8",
  surfaceDim: "#e4e8df",
  surfaceBright: "#fafbf8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f2e8",
  surfaceContainer: "#edf0eb",
  surfaceContainerHigh: "#e4e8df",
  surfaceContainerHighest: "#dce2d7",
  surfaceVariant: "#e4e8df",
  surfaceTint: "#24583f",

  // On-surface / Text
  onSurface: "#263b30",
  onSurfaceVariant: "#788278",
  onBackground: "#263b30",
  background: "#fafbf8",
  inverseSurface: "#173d2c",
  inverseOnSurface: "#f1f2e8",

  // Outline / Borders
  outline: "#788278",
  outlineVariant: "#e4e8df",

  // Error / Danger
  error: "#aa493f",
  errorContainer: "#f9ebe6",
  onError: "#ffffff",
  onErrorContainer: "#b3604c",

  // Semantic aliases
  white: "#ffffff",
  black: "#173d2c",
  border: "#e4e8df",
  borderLight: "#edf0eb",
  textPrimary: "#263b30",
  textSecondary: "#5e6a5e",
  textMuted: "#788278",
  priceRed: "#24583f", // Kaggri uses forest green for B2B prices
  success: "#24583f",
  successBg: "#eaf1e6",
  successLight: "#eaf1e6",
  successText: "#497247",
  warningBg: "#f9f0dd",
  warningLight: "#f9f0dd",
  warningText: "#a17a31",
  dangerBg: "#f9ebe6",
  dangerLight: "#f9ebe6",
  dangerText: "#b3604c",
  infoBg: "#edf0eb",
  infoLight: "#edf0eb",
  infoText: "#497247",
  gray100: "#f1f2e8",
  gray300: "#dce2d7",
  gray700: "#516153",
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 13,
  lg: 16,
  xl: 18,
  xxl: 22,
  "display-xl": 30,
  "display-lg": 26,
  "headline-xl": 22,
  "headline-lg": 18,
  "headline-sm": 15,
  "title-lg": 18,
  "title-md": 16,
  "title-sm": 14,
  "body-lg": 15,
  "body-md": 13,
  "body-sm": 12,
  "label-lg": 13,
  "label-md": 12,
  "label-sm": 11,
  "label-xs": 10,
  "badge-caps": 10,
  "price-lg": 22,
  "price-display": 16,
  "price-unit": 13,
  "tab-bar": 10,
} as const;

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  gutter: 16,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 7,
  lg: 9,
  xl: 11,
  xxl: 14,
  "2xl": 14,
  full: 9999,
} as const;

// Kaggri-Trade uses crisp 1px borders and very subtle, flat shadows
export const shadows = {
  xs: {
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  md: {
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  lg: {
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  xl: {
    shadowColor: "#173d2c",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Medical Pantry brand colors.
 * Red is the primary CTA/highlight color, navy is used for depth and contrast.
 */
export const BrandColors = {
  red: '#d02327',
  navy: '#141a43',
  white: '#ffffff',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: BrandColors.red,
    primaryText: BrandColors.white,
    secondary: BrandColors.navy,
    secondaryText: BrandColors.white,
    // DESIGN.md tokens (Medical Pantry design system)
    ink: '#141a43',
    body: '#4a4a4a',
    mute: '#8a8d99',
    canvas: '#ffffff',
    canvasSoft: '#f5f5f7',
    canvasNavy: '#141a43',
    surfacePressed: '#e8e8ea',
    link: BrandColors.red,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: BrandColors.red,
    primaryText: BrandColors.white,
    secondary: BrandColors.navy,
    secondaryText: BrandColors.white,
    // DESIGN.md only specifies a light theme — these dark equivalents are derived,
    // not designer-specified, to keep the app usable in dark mode.
    ink: '#ffffff',
    body: '#c7c9d1',
    mute: '#8a8d99',
    canvas: '#000000',
    canvasSoft: '#212225',
    canvasNavy: '#141a43',
    surfacePressed: '#2E3135',
    link: BrandColors.red,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Poppins is the brand typeface — bold for headings, regular for body text. */
export const FontFamily = {
  regular: 'Poppins_400Regular',
  bold: 'Poppins_700Bold',
} as const;

/** DESIGN.md typography scale. */
export const Typography = {
  displayXxl: { fontFamily: FontFamily.bold, fontSize: 48, lineHeight: 58 },
  displayXl: { fontFamily: FontFamily.bold, fontSize: 34, lineHeight: 42 },
  displayLg: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36 },
  displayMd: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 30 },
  displaySm: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 26 },
  bodyLg: { fontFamily: FontFamily.regular, fontSize: 17, lineHeight: 25.5 },
  bodyMd: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22.5 },
  bodyMdStrong: { fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 22.5 },
  bodySm: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19.5 },
  caption: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18 },
  buttonMd: { fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 20 },
} as const;

/** DESIGN.md border-radius scale. */
export const Radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/** DESIGN.md elevation levels, expressed as RN shadow/elevation props. */
export const Elevation = {
  level1: {
    shadowColor: BrandColors.navy,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  level2: {
    shadowColor: BrandColors.navy,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  // Not part of DESIGN.md's scale — kept for a couple of hairline-sized gaps
  // that don't map onto xxs (4px).
  half: 2,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

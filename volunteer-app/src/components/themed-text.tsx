import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { BrandColors, Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'heading' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'heading' && styles.heading,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    ...Typography.bodySm,
  },

  smallBold: {
    ...Typography.bodyMdStrong,
  },

  default: {
    ...Typography.bodyMd,
  },

  title: {
    ...Typography.displayXxl,
  },

  subtitle: {
    ...Typography.displayXl,
  },

  heading: {
    ...Typography.displayMd,
  },

  link: {
    ...Typography.bodyMd,
  },

  linkPrimary: {
    ...Typography.bodyMdStrong,
    color: BrandColors.red,
  },

  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

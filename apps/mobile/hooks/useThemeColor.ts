import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

type ThemeColors = typeof Colors.light;

export function useThemeColor(): ThemeColors;
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
): string;
export function useThemeColor(
  props?: { light?: string; dark?: string },
  colorName?: keyof ThemeColors
): string | ThemeColors {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props?.[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  if (colorName) {
    return Colors[theme][colorName];
  }

  return Colors[theme];
}

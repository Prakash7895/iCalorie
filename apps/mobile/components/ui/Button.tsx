import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  onPress: () => void;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  title,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
}: ButtonProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(disabled ? 0.6 : 1),
  }));

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.accent;
      case 'secondary':
        return colors.accentSoft;
      case 'ghost':
        return 'transparent';
      case 'icon':
        return colors.surface;
      default:
        return colors.accent;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.white;
      case 'secondary':
        return colors.accent;
      case 'ghost':
        return colors.secondary;
      case 'icon':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        variant === 'icon' && styles.iconButton,
        variant === 'primary' && SHADOWS.medium,
        variant === 'icon' && SHADOWS.small,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={variant === 'icon' ? 24 : 20}
              color={getTextColor()}
              style={title ? styles.iconRight : undefined}
            />
          )}
          {title && (
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          )}
          {children}
        </>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  iconButton: {
    padding: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconRight: {
    marginRight: 8,
  },
});

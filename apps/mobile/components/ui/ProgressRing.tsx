import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 1
  target?: number;
  current?: number;
}

export function ProgressRing({
  radius = 80,
  stroke = 12,
  progress,
  target = 2000,
  current = 0,
}: ProgressRingProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = useSharedValue(circumference);

  useEffect(() => {
    strokeDashoffset.value = withDelay(
      500,
      withTiming(circumference - progress * circumference, { duration: 1500 })
    );
  }, [progress, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  return (
    <View style={styles.container}>
      <Svg
        height={radius * 2}
        width={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <G rotation='-90' origin={`${radius}, ${radius}`}>
          {/* Background Circle */}
          <Circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            stroke={colors.bg}
            strokeWidth={stroke}
            fill='transparent'
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap='round'
            fill='transparent'
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={styles.content}>
        <Text style={styles.value}>{Math.round(current)}</Text>
        <Text style={styles.label}>of {target} kcal</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 80;
const BAR_GAP = 12;
const BAR_WIDTH = (CHART_WIDTH - BAR_GAP * 6) / 7;
const MAX_BAR_HEIGHT = 120;

interface BarChartProps {
  data: { date: string; total_calories: number }[];
  target: number;
  containerStyle?: any;
}

export function BarChart({ data, target, containerStyle }: BarChartProps) {
  const maxCalories = Math.max(...data.map((d) => d.total_calories), target, 1);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>Weekly Trends</Text>
      <View style={styles.chartArea}>
        {data.map((item, index) => (
          <Bar
            key={item.date}
            value={item.total_calories}
            maxValue={maxCalories}
            target={target}
            label={
              new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'short',
              })[0]
            }
            delay={index * 100}
          />
        ))}
      </View>
    </View>
  );
}

function Bar({
  value,
  maxValue,
  target,
  label,
  delay,
}: {
  value: number;
  maxValue: number;
  target: number;
  label: string;
  delay: number;
}) {
  const height = useSharedValue(0);
  const targetHeight = (value / maxValue) * MAX_BAR_HEIGHT;

  useEffect(() => {
    height.value = withDelay(
      delay + 300,
      withTiming(targetHeight, { duration: 1000 })
    );
  }, [targetHeight, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const isOverTarget = value > target;

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            animatedStyle,
            isOverTarget && { backgroundColor: COLORS.error },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT + 16,
  },
  barWrapper: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  barBackground: {
    width: BAR_WIDTH,
    height: MAX_BAR_HEIGHT,
    backgroundColor: COLORS.bg,
    borderRadius: BAR_WIDTH / 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: BAR_WIDTH / 2,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});

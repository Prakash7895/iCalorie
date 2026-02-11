import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getLog } from '@/lib/api';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';

export default function HomeScreen() {
  const router = useRouter();
  const [totalToday, setTotalToday] = useState(0);
  const [recentMeals, setRecentMeals] = useState<
    { name: string; kcal: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await getLog(today);
      const items = Array.isArray(data.items) ? data.items : [];
      const total = items.reduce(
        (sum: number, m: any) => sum + (m.total_calories ?? 0),
        0
      );
      setTotalToday(Math.round(total));
      setRecentMeals(
        items.slice(0, 3).map((m: any, i: number) => ({
          name: `Meal ${i + 1}`,
          kcal: Math.round(m.total_calories ?? 0),
        }))
      );
    } catch {
      setTotalToday(0);
      setRecentMeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [today]);

  const progress = Math.min(totalToday / 2000, 1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchSummary}
          tintColor={COLORS.accent}
        />
      }
    >
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.title}>Ready to track?</Text>
        </View>
        <Button
          variant='icon'
          icon='person-outline'
          onPress={() => {}}
          style={styles.profileBtn}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={styles.ringCard}
      >
        <ProgressRing progress={progress} current={totalToday} target={2000} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={styles.actions}
      >
        <Button
          title='Scan Meal'
          icon='camera'
          onPress={() => router.push('/capture?autoCamera=1')}
          style={styles.actionBtn}
        />
        <Button
          title='Manual Log'
          variant='secondary'
          icon='add-circle'
          onPress={() => router.push('/log')}
          style={styles.actionBtn}
        />
      </Animated.View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        {recentMeals.length > 0 ? (
          recentMeals.map((meal, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(600 + index * 100).springify()}
              style={styles.mealCard}
            >
              <View style={styles.mealIcon}>
                <Ionicons
                  name='fast-food-outline'
                  size={20}
                  color={COLORS.accent}
                />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>Today</Text>
              </View>
              <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
            </Animated.View>
          ))
        ) : (
          <Text style={styles.emptyText}>No meals tracked today yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileBtn: {
    backgroundColor: COLORS.white,
  },
  ringCard: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mealTime: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  mealKcal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.secondary,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

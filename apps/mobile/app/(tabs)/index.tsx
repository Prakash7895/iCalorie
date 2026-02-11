import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getLog } from '@/lib/api';
import { storage } from '@/lib/storage';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [totalToday, setTotalToday] = useState(0);
  const [recentMeals, setRecentMeals] = useState<
    { name: string; kcal: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const fetchUserData = async () => {
    const userData = await storage.getUserData();
    setUser(userData);
    if (userData?.name) {
      setUserName(userData.name);
    } else if (userData?.email) {
      setUserName(userData.email.split('@')[0]);
    }
  };

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
    fetchUserData();
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
        <View style={styles.greetingContainer}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>{userName || 'Guest'}</Text>
            <Text style={styles.subtitle}>
              Let's track your nutrition today
            </Text>
          </View>
          <Pressable
            style={styles.avatarContainer}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.avatar}>
              {userName && user?.profile_picture_url ? (
                <Image
                  source={{ uri: user.profile_picture_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name='person' size={24} color={COLORS.white} />
              )}
            </View>
          </Pressable>
        </View>
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
    backgroundColor: COLORS.accent,
    marginHorizontal: -20,
    marginTop: -60,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

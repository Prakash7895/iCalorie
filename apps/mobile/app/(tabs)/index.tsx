import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { getLog, getSummary, API_BASE_URL } from '@/lib/api';
import { storage } from '@/lib/storage';
import { authenticatedFetch } from '@/lib/authFetch';
import { COLORS, SHADOWS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart } from '@/components/ui/BarChart';
import TokenPurchaseModal from '@/components/TokenPurchaseModal';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [totalToday, setTotalToday] = useState(0);
  const [recentMeals, setRecentMeals] = useState<
    { name: string; kcal: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [scanBalance, setScanBalance] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState<
    { date: string; total_calories: number }[]
  >([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const fetchUserData = async () => {
    try {
      // First, load from storage for immediate display (optimistic UI)
      const cachedUserData = await storage.getUserData();
      if (cachedUserData) {
        setUser(cachedUserData);
        if (cachedUserData?.name) {
          setUserName(cachedUserData.name);
        } else if (cachedUserData?.email) {
          setUserName(cachedUserData.email.split('@')[0]);
        }
      }

      // Always fetch fresh data from API to ensure latest profile picture, etc.
      const token = await storage.getAuthToken();
      if (!token) return;

      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);

      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
        setScanBalance(freshUserData.scans_remaining || 0);
        // Update storage with fresh data
        await storage.setUserData(freshUserData);

        if (freshUserData?.name) {
          setUserName(freshUserData.name);
        } else if (freshUserData?.email) {
          setUserName(freshUserData.email.split('@')[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If API fails and we don't have cached data, try storage one more time
      if (!user) {
        const userData = await storage.getUserData();
        if (userData) {
          setUser(userData);
          setScanBalance(userData.scans_remaining || 0);
          await storage.setUserData(userData);
          if (userData?.name) {
            setUserName(userData.name);
          } else if (userData?.email) {
            setUserName(userData.email.split('@')[0]);
          }
        }
      }
    }
  };

  const fetchLog = async () => {
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

  const fetchWeeklySummary = async () => {
    try {
      const data = await getSummary();
      setWeeklySummary(data.summary);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchLog();
      fetchWeeklySummary();
    }, [today])
  );

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const progress = Math.min(totalToday / calorieGoal, 1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (SCREEN_WIDTH - 40));
    setCarouselIndex(index);
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              fetchUserData();
              fetchLog();
              fetchWeeklySummary();
            }}
            tintColor={COLORS.accent}
          />
        }
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <View style={styles.topRow}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.subtitle}>
                Let's track your nutrition today
              </Text>
            </View>
            <Pressable
              style={styles.avatarContainer}
              onPress={() => router.push('/profile')}
            >
              <View style={styles.avatar}>
                {user?.profile_picture_url ? (
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

          {/* Conditional Scan Status */}
          {user?.scans_remaining !== undefined && user.scans_remaining < 10 && (
            <Pressable
              style={styles.scanStatusBanner}
              onPress={() => setPurchaseModalVisible(true)}
            >
              <View style={styles.scanBadge}>
                <Ionicons name='flash' size={12} color={COLORS.accent} />
                <Text style={styles.scanBadgeText}>{user.scans_remaining}</Text>
              </View>
              <Text style={styles.scanStatusText}>
                AI Analysis Scans remaining. Tap to add more.
              </Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContent}
          >
            {/* Daily Progress Slide */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={{ width: SCREEN_WIDTH }}
            >
              <View style={styles.carouselCard}>
                <View style={styles.ringCard}>
                  <Pressable
                    style={styles.cardSettingsBtn}
                    onPress={() => router.push('/profile')}
                  >
                    <Ionicons
                      name='settings-outline'
                      size={20}
                      color={COLORS.secondary}
                    />
                  </Pressable>
                  <ProgressRing
                    progress={progress}
                    current={totalToday}
                    target={calorieGoal}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Weekly Trends Slide */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              style={{ width: SCREEN_WIDTH }}
            >
              <View style={styles.carouselCard}>
                <View style={styles.summarySection}>
                  <BarChart
                    data={weeklySummary}
                    target={calorieGoal}
                    containerStyle={styles.barChartContainer}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Pagination Indicators */}
          <View style={styles.pagination}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[styles.dot, carouselIndex === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>

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

      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        currentBalance={scanBalance || user?.scans_remaining || 0}
        onPurchaseComplete={() => {
          // Refresh user data to get updated token balance
          fetchUserData();
        }}
      />
    </>
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
    gap: 16,
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
  carouselContainer: {
    marginVertical: 10,
    marginHorizontal: -20,
    overflow: 'visible', // Allow shadows to be visible
  },
  carouselContent: {
    paddingHorizontal: 0,
    paddingBottom: 20, // Space for shadows
  },
  carouselCard: {
    paddingHorizontal: 20,
    width: '100%',
  },
  ringCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    ...SHADOWS.medium,
    height: 260,
    justifyContent: 'center',
    position: 'relative',
  },
  cardSettingsBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  summarySection: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    ...SHADOWS.medium,
    height: 260,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barChartContainer: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingTextContainer: {
    flex: 1,
  },
  scanStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scanBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  scanStatusText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
  },
  editGoalText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
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
    borderRadius: 20,
  },
});

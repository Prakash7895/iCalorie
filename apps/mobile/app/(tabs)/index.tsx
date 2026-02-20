import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { getLog, getSummary, API_BASE_URL } from '@/lib/api';
import { storage } from '@/lib/storage';
import { authenticatedFetch } from '@/lib/authFetch';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BarChart } from '@/components/ui/BarChart';
import TokenPurchaseModal from '@/components/TokenPurchaseModal';
import ManualLogModal from '@/components/ManualLogModal';
import FeedbackModal from '@/components/FeedbackModal';
import HomeHeader from '@/components/HomeHeader';

export default function HomeScreen() {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [totalToday, setTotalToday] = useState(0);
  const [recentMeals, setRecentMeals] = useState<
    {
      id: number;
      name: string;
      kcal: number;
      photo_url?: string | null;
      items?: any[];
      created_at?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [scanBalance, setScanBalance] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState<
    { date: string; total_calories: number }[]
  >([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [manualLogVisible, setManualLogVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const scrollY = useSharedValue(0);

  const hasBanner =
    user?.scans_remaining !== undefined && user.scans_remaining < 10;
  const HEADER_MAX_HEIGHT = hasBanner ? 190 : 130;

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
        items.slice(0, 3).map((m: any) => ({
          id: m.id,
          name: (() => {
            const hour = m.created_at
              ? new Date(m.created_at).getHours()
              : new Date().getHours();
            if (hour >= 5 && hour < 11) return 'Breakfast';
            if (hour >= 11 && hour < 16) return 'Lunch';
            if (hour >= 16 && hour < 21) return 'Dinner';
            return 'Snack';
          })(),
          kcal: Math.round(m.total_calories ?? 0),
          photo_url: m.photo_url,
          items: m.items,
          created_at: m.created_at,
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
      // Ensure we have 7 days of data for accurate averaging
      const summary = data.summary || [];
      setWeeklySummary(summary);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Don't set global loading here to avoid full-screen spinner or blocking UI
      fetchUserData();
      fetchLog();
      fetchWeeklySummary();
    }, [today])
  );

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const progress = Math.min(totalToday / calorieGoal, 1);
  const kcalRemaining = calorieGoal - totalToday;

  // Calculate Weekly Insights
  const { weeklyAvg, daysMetGoal } = useMemo(() => {
    if (!weeklySummary || weeklySummary.length === 0) {
      return { weeklyAvg: 0, daysMetGoal: 0 };
    }
    // Only count days that have passed or are today for the average
    const relevantDays = weeklySummary.filter((day) => day.date <= today);
    const sum = relevantDays.reduce((acc, day) => acc + day.total_calories, 0);
    const avg =
      relevantDays.length > 0 ? Math.round(sum / relevantDays.length) : 0;
    const met = weeklySummary.filter(
      (day) => day.total_calories <= calorieGoal && day.total_calories > 0
    ).length;
    return { weeklyAvg: avg, daysMetGoal: met };
  }, [weeklySummary, calorieGoal, today]);

  const handleProfilePress = useCallback(
    () => router.push('/profile'),
    [router]
  );
  const handleScanStatusPress = useCallback(
    () => setPurchaseModalVisible(true),
    []
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    if (index !== carouselIndex) {
      setCarouselIndex(index);
    }
  };

  const renderHeader = useCallback(
    () => (
      <HomeHeader
        user={user}
        scrollY={scrollY}
        onProfilePress={handleProfilePress}
        onScanStatusPress={handleScanStatusPress}
      />
    ),
    [user, scrollY, handleProfilePress, handleScanStatusPress]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: renderHeader,
          headerTransparent: true,
        }}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              setLoading(true);
              try {
                await Promise.all([
                  fetchUserData(),
                  fetchLog(),
                  fetchWeeklySummary(),
                ]);
              } catch (error) {
                console.error('Refresh failed:', error);
              } finally {
                setLoading(false);
              }
            }}
            tintColor={colors.accent}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
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
                      color={colors.secondary}
                    />
                  </Pressable>
                  <ProgressRing
                    progress={progress}
                    current={totalToday}
                    target={calorieGoal}
                  />
                  <View style={styles.cardInsightRow}>
                    <Ionicons
                      name={
                        kcalRemaining >= 0
                          ? 'information-circle-outline'
                          : 'warning-outline'
                      }
                      size={16}
                      color={kcalRemaining >= 0 ? colors.accent : colors.error}
                    />
                    <Text
                      style={[
                        styles.cardInsightText,
                        kcalRemaining < 0 && { color: colors.error },
                      ]}
                    >
                      {kcalRemaining >= 0
                        ? `${Math.round(kcalRemaining)} kcal remaining`
                        : `Over by ${Math.abs(Math.round(kcalRemaining))} kcal`}
                    </Text>
                  </View>
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
                    today={today}
                    containerStyle={styles.barChartContainer}
                  />
                  <View style={styles.cardInsightRow}>
                    <View style={styles.trendMetric}>
                      <Ionicons
                        name='stats-chart'
                        size={14}
                        color={colors.accent}
                      />
                      <Text style={styles.cardInsightText}>
                        Avg: {weeklyAvg} kcal
                      </Text>
                    </View>
                    <View style={styles.trendMetric}>
                      <Ionicons
                        name='checkmark-circle'
                        size={14}
                        color={colors.accent}
                      />
                      <Text style={styles.cardInsightText}>
                        Met Goal: {daysMetGoal}/7 days
                      </Text>
                    </View>
                  </View>
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
            onPress={() => router.push('/capture')}
            style={styles.actionBtn}
          />
          <Button
            title='Manual Log'
            variant='secondary'
            icon='add-circle'
            onPress={() => setManualLogVisible(true)}
            style={styles.actionBtn}
          />
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          {recentMeals.length > 0 ? (
            recentMeals.map((meal, index) => (
              <Animated.View
                key={meal.id || index}
                entering={FadeInUp.delay(600 + index * 100).springify()}
              >
                <Pressable
                  style={styles.mealCard}
                  onPress={() => router.push(`/meal/${meal.id}`)}
                >
                  {meal.photo_url ? (
                    <Image
                      source={{ uri: meal.photo_url }}
                      style={styles.mealThumbnail}
                      transition={200}
                      cachePolicy='memory-disk'
                    />
                  ) : (
                    <View style={styles.mealIcon}>
                      <Ionicons
                        name='fast-food-outline'
                        size={20}
                        color={colors.accent}
                      />
                    </View>
                  )}
                  <View style={styles.mealInfo}>
                    <View style={styles.mealHeaderRow}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealTime}>
                        {meal.created_at
                          ? new Date(meal.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Today'}
                      </Text>
                    </View>
                    <Text style={styles.mealItems} numberOfLines={1}>
                      {meal.items?.map((i) => i.name).join(', ') ||
                        'No items listed'}
                    </Text>
                  </View>
                  <View style={styles.mealKcalBadge}>
                    <Text style={styles.mealKcal}>{meal.kcal}</Text>
                    <Text style={styles.mealKcalUnit}>kcal</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          ) : (
            <Text style={styles.emptyText}>No meals tracked today yet.</Text>
          )}
        </View>
      </Animated.ScrollView>

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
      <ManualLogModal
        visible={manualLogVisible}
        onClose={() => setManualLogVisible(false)}
        onSuccess={() => {
          fetchLog();
          fetchUserData();
          fetchWeeklySummary();
        }}
      />

      {/* Feedback FAB */}
      <Pressable style={styles.fab} onPress={() => setFeedbackVisible(true)}>
        <Ionicons name='chatbubble-ellipses' size={24} color={colors.white} />
      </Pressable>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 16,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 16,
    },
    carouselContainer: {
      marginVertical: 10,
      marginHorizontal: -20,
      overflow: 'visible',
    },
    carouselContent: {
      paddingHorizontal: 0,
      paddingBottom: 20,
    },
    carouselCard: {
      paddingHorizontal: 20,
      width: '100%',
    },
    ringCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 24,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
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
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    summarySection: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      height: 260,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    barChartContainer: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
      padding: 20,
      paddingBottom: 10,
    },
    cardInsightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    cardInsightText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondary,
    },
    trendMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
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
      backgroundColor: colors.secondary,
      opacity: 0.3,
    },
    activeDot: {
      width: 16,
      backgroundColor: colors.accent,
      opacity: 1,
    },
    avatarContainer: {
      marginLeft: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
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
      backgroundColor: colors.bg,
    },
    editGoalText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
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
      color: colors.primary,
    },
    mealCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 20,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    mealThumbnail: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.bg,
    },
    mealIcon: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mealInfo: {
      flex: 1,
      marginLeft: 16,
      marginRight: 8,
    },
    mealHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mealName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    mealTime: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: '500',
    },
    mealItems: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 4,
      fontWeight: '400',
    },
    mealKcalBadge: {
      alignItems: 'flex-end',
      minWidth: 50,
    },
    mealKcal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    mealKcalUnit: {
      fontSize: 11,
      color: colors.secondary,
      fontWeight: '600',
      marginTop: -2,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.secondary,
      marginTop: 20,
      fontStyle: 'italic',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 22,
    },
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 10,
      zIndex: 100,
    },
  });

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getLog } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authenticatedFetch } from '@/lib/authFetch';
import { API_BASE_URL } from '@/constants/api';
import { storage } from '@/lib/storage';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';

type LogItem = {
  id: number;
  items?: { name: string; calories?: number; grams?: number }[];
  total_calories?: number;
  created_at?: string;
  photo_url?: string | null;
};

export default function LogScreen() {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchUserData = async () => {
    try {
      const cachedUserData = await storage.getUserData();
      if (cachedUserData) {
        setUser(cachedUserData);
      }

      const token = await storage.getAuthToken();
      if (!token) return;

      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
        await storage.setUserData(freshUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const data = await getLog(selectedDate);
      setLogs(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load log');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  // Refresh data when screen comes into focus (e.g., after deleting a meal)
  useFocusEffect(
    useCallback(() => {
      fetchLog();
      fetchUserData();
    }, [fetchLog])
  );

  const calorieGoal = user?.daily_calorie_goal || 2000;
  const totalCalories = logs.reduce(
    (sum, log) => sum + (log.total_calories || 0),
    0
  );
  const progress = Math.min(totalCalories / calorieGoal, 1);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date.toISOString().slice(0, 10));
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Daily Log</Text>
            <Text style={styles.dateSubtitle}>{formattedDate}</Text>
          </View>
          <View style={styles.dateActions}>
            <Pressable
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name='calendar' size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.dividerVertical} />
            <Pressable style={styles.dateBtn} onPress={() => changeDate(-1)}>
              <Ionicons name='chevron-back' size={20} color={colors.primary} />
            </Pressable>
            {!isToday && (
              <Pressable style={styles.dateBtn} onPress={() => changeDate(1)}>
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode='date'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Summary Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.summaryCard}
        >
          <View style={styles.summaryInfo}>
            <View>
              <Text style={styles.summaryLabel}>Daily Progress</Text>
              <Text style={styles.summaryValue}>
                {Math.round(totalCalories)}{' '}
                <Text style={styles.summaryGoal}>/ {calorieGoal} kcal</Text>
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View
              entering={FadeInDown.delay(500)}
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLog}
            tintColor={colors.accent}
          />
        }
      >
        {loading && logs.length === 0 && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color={colors.accent} />
          </View>
        )}

        {errorText && (
          <View style={styles.errorCard}>
            <Ionicons name='alert-circle' size={20} color={colors.error} />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        )}

        {!loading && logs.length === 0 && !errorText && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name='clipboard-outline'
                size={40}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No meals logged</Text>
            <Text style={styles.emptyText}>
              Your food timeline will appear here.
            </Text>
          </View>
        )}

        <View style={styles.timeline}>
          {logs.map((log, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(idx * 100).springify()}
              layout={Layout.springify()}
              style={styles.timelineItem}
            >
              {/* Timeline Node */}
              <View style={styles.timelineLeft}>
                <View style={styles.nodeLine} />
                <View
                  style={[styles.nodeCircle, idx === 0 && styles.nodeActive]}
                />
              </View>

              {/* Content Card */}
              <Pressable
                style={styles.logCard}
                onPress={() => {
                  if (log.id) {
                    router.push(`/meal/${log.id}`);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.mealBadge}>
                    <Ionicons
                      name='restaurant'
                      size={12}
                      color={colors.white}
                    />
                    <Text style={styles.mealBadgeText}>
                      {(() => {
                        const hour = log.created_at
                          ? new Date(log.created_at).getHours()
                          : new Date().getHours();
                        if (hour >= 5 && hour < 11) return 'Breakfast';
                        if (hour >= 11 && hour < 16) return 'Lunch';
                        if (hour >= 16 && hour < 21) return 'Dinner';
                        return 'Snack';
                      })()}
                    </Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </Text>
                </View>

                <View style={styles.cardContentRow}>
                  <View style={styles.cardTextContent}>
                    <Text style={styles.totalKcal}>
                      {Math.round(log.total_calories ?? 0)}
                      <Text style={styles.unit}> kcal</Text>
                    </Text>

                    <View style={styles.itemPreview}>
                      <Text style={styles.itemPreviewText} numberOfLines={1}>
                        {(log.items || []).map((i) => i.name).join(', ')}
                      </Text>
                    </View>
                  </View>

                  {log.photo_url && (
                    <Image
                      source={{ uri: log.photo_url }}
                      style={styles.mealThumbnail}
                    />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: colors.bg,
      zIndex: 10,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
    },
    dateSubtitle: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: '600',
      marginTop: 2,
    },
    dateActions: {
      flexDirection: 'row',
      gap: 8,
    },
    dateBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    dividerVertical: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: 4,
      alignSelf: 'center',
    },
    summaryCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    summaryInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 2,
    },
    summaryGoal: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondary,
    },
    percentageBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    percentageText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.bg,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    centerContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFE5E5',
      padding: 16,
      borderRadius: 12,
      gap: 12,
      marginBottom: 20,
    },
    errorText: {
      color: colors.error,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 60,
      opacity: 0.8,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#EAEAEA',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
    },
    emptyText: {
      color: colors.secondary,
    },
    timeline: {
      marginTop: 10,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    timelineLeft: {
      width: 30,
      alignItems: 'center',
      marginRight: 10,
    },
    nodeLine: {
      position: 'absolute',
      top: 20,
      bottom: -30,
      width: 2,
      backgroundColor: colors.border,
      zIndex: -1,
    },
    nodeCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.border,
      marginTop: 18,
      borderWidth: 2,
      borderColor: colors.bg,
    },
    nodeActive: {
      backgroundColor: colors.accent,
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    logCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    mealBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      gap: 6,
    },
    mealBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    timestamp: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: '500',
    },
    cardContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardTextContent: {
      flex: 1,
    },
    mealThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: colors.bg,
    },
    totalKcal: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    unit: {
      fontSize: 14,
      color: colors.secondary,
      fontWeight: '500',
    },
    itemPreview: {
      marginTop: 4,
    },
    itemPreviewText: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: '500',
    },
  });

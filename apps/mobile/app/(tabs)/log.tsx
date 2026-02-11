import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getLog } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/colors';

type LogItem = {
  items?: { name: string; calories?: number; grams?: number }[];
  total_calories?: number;
  created_at?: string;
  photo_url?: string | null;
};

export default function LogScreen() {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const data = await getLog(today);
      setLogs(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load log');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLog}
            tintColor={COLORS.accent}
          />
        }
      >
        {loading && logs.length === 0 && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color={COLORS.accent} />
          </View>
        )}

        {errorText && (
          <View style={styles.errorCard}>
            <Ionicons name='alert-circle' size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        )}

        {!loading && logs.length === 0 && !errorText && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name='clipboard-outline'
                size={40}
                color={COLORS.secondary}
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
              <View style={styles.logCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.mealBadge}>
                    <Ionicons
                      name='restaurant'
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.mealBadgeText}>
                      Meal {logs.length - idx}
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

                <View style={styles.cardContent}>
                  <Text style={styles.totalKcal}>
                    {Math.round(log.total_calories ?? 0)}
                    <Text style={styles.unit}> kcal</Text>
                  </Text>

                  <View style={styles.divider} />

                  {(log.items || []).map((item, i) => (
                    <View key={`${item.name}-${i}`} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.dots} />
                      <Text style={styles.itemKcal}>{item.calories ?? 0}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  date: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
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
    color: COLORS.error,
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
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.secondary,
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
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  nodeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.border,
    marginTop: 18,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  nodeActive: {
    backgroundColor: COLORS.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  logCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  mealBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  cardContent: {
    gap: 4,
  },
  totalKcal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  unit: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  dots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    marginHorizontal: 8,
    marginTop: 4,
  },
  itemKcal: {
    fontSize: 14,
    color: COLORS.secondary,
  },
});

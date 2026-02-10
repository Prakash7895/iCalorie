import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLog } from '@/lib/api';

const COLORS = {
  bg: '#F6F1EA',
  card: '#FFFFFF',
  text: '#1F1F1F',
  muted: '#6D6D6D',
  accent: '#1E7A5D',
  accentSoft: '#E0F3EA',
  line: '#E4DED6',
};

export default function HomeScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [totalToday, setTotalToday] = useState(0);
  const [recentMeals, setRecentMeals] = useState<{ name: string; kcal: number }[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeIn, slideUp]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const data = await getLog(today);
        const items = Array.isArray(data.items) ? data.items : [];
        const total = items.reduce(
          (sum: number, m: any) => sum + (m.total_calories ?? 0),
          0
        );
        setTotalToday(Math.round(total));
        setRecentMeals(
          items.slice(0, 2).map((m: any, i: number) => ({
            name: `Meal ${i + 1}`,
            kcal: Math.round(m.total_calories ?? 0),
          }))
        );
      } catch {
        setTotalToday(0);
        setRecentMeals([]);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [today]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.bgBlobOne} />
      <View style={styles.bgBlobTwo} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>iCalorie</Text>
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <Ionicons name="sparkles" size={20} color={COLORS.accent} />
        </Animated.View>
      </View>
      <Text style={styles.subtitle}>Smart calorie vision</Text>

      <Animated.View
        style={[
          styles.heroCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        <Text style={styles.heroTitle}>Track meals</Text>
        <Text style={styles.heroTitle}>in seconds</Text>
        <Text style={styles.heroCopy}>Scan your plate and get instant estimates</Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/capture?autoCamera=1')}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Scan Meal</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.summaryCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.kcalRow}>
          <Text style={styles.kcal}>
            {loadingSummary ? '...' : `${totalToday} kcal`}
          </Text>
          <View style={styles.goalPill}>
            <Ionicons name="flag-outline" size={12} color={COLORS.accent} />
            <Text style={styles.goalText}>Goal 2,000</Text>
          </View>
        </View>
        <Text style={styles.muted}>You’re on track today</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/log')}>
          <Text style={styles.secondaryButtonText}>View log</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.sectionTitle}>Recent</Text>
      <Animated.View
        style={[
          styles.listCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        {recentMeals.length === 0 ? (
          <Text style={styles.muted}>No recent meals yet.</Text>
        ) : (
          recentMeals.map((m, idx) => (
            <View key={m.name}>
              <View style={styles.row}>
                <Text style={styles.body}>{m.name}</Text>
                <Text style={styles.muted}>{m.kcal} kcal</Text>
              </View>
              {idx < recentMeals.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))
        )}
      </Animated.View>
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
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },
  bgBlobOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FAD7C0',
    top: -40,
    right: -60,
    opacity: 0.6,
  },
  bgBlobTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.accentSoft,
    top: 20,
    left: -40,
    opacity: 0.8,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroCopy: {
    color: COLORS.muted,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  goalText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  kcal: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  muted: {
    color: COLORS.muted,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: COLORS.accentSoft,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
  },
});

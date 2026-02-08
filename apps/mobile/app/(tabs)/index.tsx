import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.bgBlobOne} />
      <View style={styles.bgBlobTwo} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>iCalorie</Text>
        <Ionicons name="sparkles" size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.subtitle}>Smart calorie vision</Text>

      <Animated.View style={[styles.heroCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.heroTitle}>Track meals</Text>
        <Text style={styles.heroTitle}>in seconds</Text>
        <Text style={styles.heroCopy}>Scan your plate and get instant estimates</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/capture?autoCamera=1')}>
          <Ionicons name="camera" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Scan Meal</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.summaryCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.kcal}>1,240 kcal</Text>
        <Text style={styles.muted}>Target 2,000 kcal</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/')}>
          <Text style={styles.secondaryButtonText}>View log</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.sectionTitle}>Recent</Text>
      <Animated.View
        style={[
          styles.listCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        <View style={styles.row}>
          <Text style={styles.body}>Lunch</Text>
          <Text style={styles.muted}>520 kcal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.body}>Snack</Text>
          <Text style={styles.muted}>210 kcal</Text>
        </View>
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

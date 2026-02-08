import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

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
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>iCalorie</Text>
      <Text style={styles.subtitle}>Smart calorie vision</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Track meals</Text>
        <Text style={styles.heroTitle}>in seconds</Text>
        <Text style={styles.heroCopy}>Scan your plate and get instant estimates</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/capture?autoCamera=1')}>
          <Text style={styles.primaryButtonText}>Scan Meal</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.kcal}>1,240 kcal</Text>
        <Text style={styles.muted}>Target 2,000 kcal</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/')}>
          <Text style={styles.secondaryButtonText}>View log</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Recent</Text>
      <View style={styles.listCard}>
        <View style={styles.row}>
          <Text style={styles.body}>Lunch</Text>
          <Text style={styles.muted}>520 kcal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.body}>Snack</Text>
          <Text style={styles.muted}>210 kcal</Text>
        </View>
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
    paddingBottom: 40,
    gap: 16,
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
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    gap: 6,
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

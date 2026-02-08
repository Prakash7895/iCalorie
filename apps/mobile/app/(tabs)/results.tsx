import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const ITEMS = [
  { name: 'Grilled chicken', kcal: 220, portion: 'Medium' },
  { name: 'Rice', kcal: 180, portion: 'Medium' },
  { name: 'Broccoli', kcal: 60, portion: 'Small' },
  { name: 'Sauce', kcal: 160, portion: 'Medium' },
];

export default function ResultsScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Results</Text>

      <View style={styles.photoCard}>
        <View style={styles.photoPlaceholder} />
        <Text style={styles.photoLabel}>Meal Photo</Text>
      </View>

      <Text style={styles.sectionTitle}>Estimated Total</Text>
      <Text style={styles.total}>620 kcal</Text>

      <View style={styles.itemsCard}>
        {ITEMS.map((item, idx) => (
          <View key={item.name}>
            <View style={styles.row}>
              <Text style={styles.body}>{item.name}</Text>
              <Text style={styles.muted}>{item.kcal} kcal</Text>
            </View>
            <Text style={styles.mutedSmall}>Portion: {item.portion}</Text>
            {idx < ITEMS.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/capture')}>
          <Text style={styles.secondaryButtonText}>Edit Items</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/')}>
          <Text style={styles.primaryButtonText}>Save to Log</Text>
        </Pressable>
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  photoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  photoPlaceholder: {
    height: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.line,
    backgroundColor: '#FAFAFA',
  },
  photoLabel: {
    color: COLORS.muted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  total: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.accent,
  },
  itemsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
  },
  muted: {
    color: COLORS.muted,
  },
  mutedSmall: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.accentSoft,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});

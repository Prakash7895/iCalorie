import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#F6F1EA',
  card: '#FFFFFF',
  text: '#1F1F1F',
  muted: '#6D6D6D',
  accent: '#1E7A5D',
  accentSoft: '#E0F3EA',
  line: '#E4DED6',
};

type FoodItem = {
  name: string;
  calories?: number;
  grams?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  confidence?: number;
};

export default function ResultsScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const hasImage = useMemo(() => typeof imageUri === 'string' && imageUri.length > 0, [imageUri]);

  useEffect(() => {
    const runScan = async () => {
      if (!hasImage) return;
      setLoading(true);
      setErrorText(null);
      try {
        const form = new FormData();
        form.append('image', {
          uri: imageUri as string,
          name: 'meal.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);

        const res = await fetch(`${API_BASE_URL}/scan`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          throw new Error(`Scan failed: ${res.status}`);
        }
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total_calories ?? null);
      } catch (err: any) {
        setErrorText(err?.message || 'Failed to scan image');
      } finally {
        setLoading(false);
      }
    };

    runScan();
  }, [hasImage, imageUri]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Results</Text>

      <View style={styles.photoCard}>
        <View style={styles.photoPlaceholder} />
        <Text style={styles.photoLabel}>Meal Photo</Text>
      </View>

      <Text style={styles.sectionTitle}>Estimated Total</Text>
      <Text style={styles.total}>{total !== null ? `${total} kcal` : '--'}</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}>Analyzing meal...</Text>
        </View>
      ) : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <View style={styles.itemsCard}>
        {items.map((item, idx) => (
          <View key={item.name}>
            <View style={styles.row}>
              <Text style={styles.body}>{item.name}</Text>
              <Text style={styles.muted}>{item.calories ?? 0} kcal</Text>
            </View>
            <Text style={styles.mutedSmall}>
              Portion: {item.grams ? `${item.grams} g` : 'Estimate'}
            </Text>
            {idx < items.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
        {!items.length && !loading ? (
          <Text style={styles.muted}>No items detected yet.</Text>
        ) : null}
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#C24848',
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

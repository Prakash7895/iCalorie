import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { confirmScan, scanImage, saveLog } from '@/lib/api';
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  const hasImage = useMemo(
    () => typeof imageUri === 'string' && imageUri.length > 0,
    [imageUri]
  );

  const runScan = useCallback(async () => {
    if (!hasImage) return;
    setLoading(true);
    setErrorText(null);
    try {
      const data = await scanImage(imageUri as string);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(
        typeof data.total_calories === 'number' ? data.total_calories : null
      );
      setPhotoUrl(data.photo_url ?? null);
    } catch (err: any) {
      console.log(err);
      setErrorText(err?.message || 'Failed to scan image');
    } finally {
      setLoading(false);
    }
  }, [hasImage, imageUri]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, rise]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Results</Text>

      <Animated.View
        style={[
          styles.photoCard,
          { opacity: fadeIn, transform: [{ translateY: rise }] },
        ]}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUri as string }}
            style={styles.photoPreview}
          />
        ) : (
          <View style={styles.photoPlaceholder} />
        )}
        <Text style={styles.photoLabel}>
          {hasImage ? 'Meal Photo' : 'No photo'}
        </Text>
      </Animated.View>

      <Text style={styles.sectionTitle}>Estimated Total</Text>
      <View style={styles.totalRow}>
        <Text style={styles.total}>
          {total !== null ? `${total} kcal` : '--'}
        </Text>
        <View style={styles.totalBadge}>
          <Ionicons name='flash' size={14} color={COLORS.accent} />
          <Text style={styles.totalBadgeText}>AI Estimate</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}>Analyzing meal...</Text>
        </View>
      ) : null}
      {errorText ? (
        <View style={styles.errorCard}>
          <Ionicons name='alert-circle' size={18} color='#C24848' />
          <Text style={styles.errorText}>{errorText}</Text>
          <Pressable style={styles.retryButton} onPress={runScan}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.itemsCard,
          { opacity: fadeIn, transform: [{ translateY: rise }] },
        ]}
      >
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
      </Animated.View>

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/capture')}
        >
          <Text style={styles.secondaryButtonText}>Edit Items</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
            try {
              setLoading(true);
              setErrorText(null);
              const confirmed = await confirmScan(items, photoUrl ?? undefined);
              await saveLog({
                items: confirmed.items,
                total_calories: confirmed.total_calories ?? null,
                photo_url: confirmed.photo_url ?? null,
                created_at: new Date().toISOString(),
              });
              router.push('/');
            } catch (err: any) {
              setErrorText(err?.message || 'Failed to save log');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          <Ionicons name='checkmark-circle' size={18} color='#FFFFFF' />
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
  photoPreview: {
    height: 180,
    borderRadius: 14,
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  totalBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  itemsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
  },
  retryButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#C24848',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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

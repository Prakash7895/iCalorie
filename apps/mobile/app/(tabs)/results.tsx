import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { confirmScan, scanImage, saveLog } from '@/lib/api';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#2D3436', // Dark elegant text
  secondary: '#636E72', // Muted text
  accent: '#00B894', // Minty fresh
  error: '#FF7675',
  border: '#DFE6E9',
  shadow: '#2D3436',
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

  // Animation values
  const scanLineY = useSharedValue(0);
  const totalScale = useSharedValue(1);

  const hasImage = typeof imageUri === 'string' && imageUri.length > 0;

  const runScan = useCallback(async () => {
    if (!hasImage) return;
    setLoading(true);
    setErrorText(null);

    // Start scanning animation
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(250, { duration: 1500, easing: Easing.linear })
      ),
      -1,
      false
    );

    try {
      const data = await scanImage(imageUri as string);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(
        typeof data.total_calories === 'number' ? data.total_calories : null
      );
      setPhotoUrl(data.photo_url ?? null);

      // Success animation pulse
      totalScale.value = withSequence(withSpring(1.2), withSpring(1));

      // Show remaining tokens if available
      if (data.remaining_tokens !== undefined) {
        // Optional: you can show a toast or subtle notification here
        console.log(`Remaining tokens: ${data.remaining_tokens}`);
      }
    } catch (err: any) {
      console.log(err);

      // Check for 402 Payment Required (insufficient tokens)
      if (
        err?.message?.includes('402') ||
        err?.message?.includes('Insufficient')
      ) {
        setErrorText('Out of free scans for today');
        Alert.alert(
          '🪙 Out of Free Scans',
          "You've used your free scan for today. Your tokens will reset in 24 hours, or you can purchase more tokens now to continue scanning.",
          [
            { text: 'Wait for Reset', style: 'cancel' },
            {
              text: 'Purchase Tokens',
              onPress: () => {
                Alert.alert(
                  'Coming Soon',
                  'Token purchase feature will be available soon!'
                );
              },
            },
          ]
        );
      } else {
        setErrorText(err?.message || 'Failed to scan image');
      }
    } finally {
      setLoading(false);
      scanLineY.value = withTiming(0); // Reset scan line
    }
  }, [hasImage, imageUri, scanLineY, totalScale]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: loading ? 1 : 0,
  }));

  const animatedTotalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScale.value }],
  }));

  const handleSave = async () => {
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
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image Section */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.imageContainer}
        >
          {hasImage ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.image} />

              {/* Scanning Overlay */}
              {loading && (
                <View style={styles.scanOverlay}>
                  <Animated.View
                    style={[styles.scanLine, animatedScanLineStyle]}
                  />
                  <View style={styles.scanGlitch} />
                </View>
              )}

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                {loading ? (
                  <View style={styles.analyzingTag}>
                    <ActivityIndicator size='small' color='#FFF' />
                    <Text style={styles.statusText}>Analyzing...</Text>
                  </View>
                ) : (
                  <View style={styles.successTag}>
                    <Ionicons name='sparkles' size={14} color='#FFF' />
                    <Text style={styles.statusText}>AI Analysis Complete</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name='image-outline'
                size={48}
                color={COLORS.secondary}
              />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </Animated.View>

        {/* Total Calories Section */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.totalSection}
        >
          <Text style={styles.totalLabel}>TOTAL CALORIES</Text>
          <Animated.Text style={[styles.totalValue, animatedTotalStyle]}>
            {total !== null ? total : '--'}
            <Text style={styles.unit}> kcal</Text>
          </Animated.Text>
        </Animated.View>

        {/* Error Message */}
        {errorText && (
          <Animated.View entering={FadeIn} style={styles.errorCard}>
            <Ionicons name='alert-circle' size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{errorText}</Text>
            <Pressable onPress={runScan} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Food Items List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Detected Items</Text>

          {items.map((item, index) => (
            <Animated.View
              key={`${item.name}-${index}`}
              entering={FadeInDown.delay(400 + index * 100).springify()}
              style={styles.itemCard}
            >
              <View style={styles.itemIcon}>
                <Ionicons
                  name='restaurant-outline'
                  size={20}
                  color={COLORS.accent}
                />
              </View>

              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  {item.grams && (
                    <Text style={styles.itemDetail}>{item.grams}g</Text>
                  )}
                  {item.confidence && (
                    <View style={styles.confidenceTag}>
                      <Text style={styles.confidenceText}>
                        {Math.round(item.confidence * 100)}% match
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.itemCalories}>
                <Text style={styles.calorieCount}>{item.calories || 0}</Text>
                <Text style={styles.calorieLabel}>kcal</Text>
              </View>
            </Animated.View>
          ))}

          {!loading && items.length === 0 && !errorText && (
            <Text style={styles.emptyState}>
              No food items detected. Try taking a clearer photo.
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={styles.actionBar}
      >
        <BlurView intensity={80} tint='light' style={styles.blurContainer}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push('/capture')}
            disabled={loading}
          >
            <Ionicons
              name='camera-reverse-outline'
              size={24}
              color={COLORS.secondary}
            />
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#FFF' />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Save Log</Text>
                <Ionicons name='arrow-forward' size={20} color='#FFF' />
              </>
            )}
          </Pressable>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 180, // Space for action bar (66px) + tab bar (70px) + spacing
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  scanGlitch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.accent,
    opacity: 0.05,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  analyzingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  successTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1E1E1',
  },
  placeholderText: {
    marginTop: 12,
    color: COLORS.secondary,
    fontSize: 16,
  },
  totalSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primary,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  listContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'transparent' : COLORS.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDetail: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  confidenceTag: {
    backgroundColor: '#F0F3F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  itemCalories: {
    alignItems: 'flex-end',
  },
  calorieCount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  calorieLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  errorCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#D63031',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  retryText: {
    color: '#D63031',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.secondary,
    marginTop: 20,
    fontStyle: 'italic',
  },
  actionBar: {
    position: 'absolute',
    bottom: 90, // Tab bar is 60px height + 15px bottom + 15px spacing = 90px
    left: 20,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : undefined,
  },
  secondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

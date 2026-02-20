import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
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
import { scanImage, deleteLog } from '@/lib/api';
import { SHADOWS } from '@/constants/colors';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

import { useThemeColor } from '@/hooks/useThemeColor';

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
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [logId, setLogId] = useState<number | null>(null);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Animation values
  const scanLineY = useSharedValue(0);
  const totalScale = useSharedValue(1);

  const hasImage = typeof imageUri === 'string' && imageUri.length > 0;

  const runScan = useCallback(async () => {
    if (!hasImage) return;
    // Clear previous scan results immediately so stale data isn't shown
    setItems([]);
    setTotal(null);
    setLogId(null);
    setMacros({ protein: 0, carbs: 0, fat: 0 });
    setPhotoUrl(null);
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
      setLogId(data.log_id ?? null);

      // Calculate total macros
      if (Array.isArray(data.items)) {
        const m = data.items.reduce(
          (acc: any, curr: any) => ({
            protein: acc.protein + (curr.protein_g || 0),
            carbs: acc.carbs + (curr.carbs_g || 0),
            fat: acc.fat + (curr.fat_g || 0),
          }),
          { protein: 0, carbs: 0, fat: 0 }
        );
        setMacros(m);
      }

      // Success animation pulse
      totalScale.value = withSequence(withSpring(1.2), withSpring(1));

      // Show remaining scans if available
      if (data.scans_remaining !== undefined) {
        // Optional: you can show a toast or subtle notification here
        console.log(`Remaining scans: ${data.scans_remaining}`);
      }
    } catch (err: any) {
      console.log(err);

      // Check for 402 Payment Required (insufficient tokens)
      if (
        err?.message?.includes('402') ||
        err?.message?.includes('Insufficient')
      ) {
        setErrorText('Insufficient scans');
        Alert.alert(
          '⚡ Out of Scans',
          "You've run out of scans. Your balance will be restored to 5 scans daily if it falls below that, or you can purchase more scans now to continue scanning.",
          [
            { text: 'Wait for Reset', style: 'cancel' },
            {
              text: 'Purchase Scans',
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

  const handleDone = async () => {
    router.push('/');
  };

  const handleDiscard = async () => {
    if (!logId) {
      router.push('/capture');
      return;
    }

    Alert.alert(
      'Discard Scan?',
      'This will delete the meal log and return to capture.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteLog(logId);
              router.push('/capture');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete log');
              router.push('/capture');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                transition={200}
                cachePolicy='memory-disk'
              />

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
                color={colors.secondary}
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

          {total !== null && (
            <View style={styles.macrosSummary}>
              <View style={styles.macroItemHeader}>
                <Text style={styles.macroValueHeader}>
                  {Math.round(macros.protein)}g
                </Text>
                <Text style={styles.macroLabelHeader}>Protein</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItemHeader}>
                <Text style={styles.macroValueHeader}>
                  {Math.round(macros.carbs)}g
                </Text>
                <Text style={styles.macroLabelHeader}>Carbs</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItemHeader}>
                <Text style={styles.macroValueHeader}>
                  {Math.round(macros.fat)}g
                </Text>
                <Text style={styles.macroLabelHeader}>Fat</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Error Message */}
        {errorText && (
          <Animated.View entering={FadeIn} style={styles.errorCard}>
            <Ionicons name='alert-circle' size={24} color={colors.error} />
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
                  color={colors.accent}
                />
              </View>

              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  {item.grams && (
                    <Text style={styles.itemDetail}>{item.grams}g</Text>
                  )}
                  {item.protein_g !== undefined && (
                    <Text style={styles.itemMacroSplit}>
                      P: {Math.round(item.protein_g)}g • C:{' '}
                      {Math.round(item.carbs_g || 0)}g • F:{' '}
                      {Math.round(item.fat_g || 0)}g
                    </Text>
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

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={styles.actionBar}
      >
        <BlurView intensity={80} tint='light' style={styles.blurContainer}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleDiscard}
            disabled={loading}
          >
            <View style={styles.discardContent}>
              <Ionicons name='trash-outline' size={22} color={colors.error} />
              <Text style={styles.discardText}>Discard</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleDone}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#FFF' />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Done</Text>
                <Ionicons name='checkmark-circle' size={22} color='#FFF' />
              </>
            )}
          </Pressable>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      paddingBottom: 60,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 4 / 3,
      position: 'relative',
      backgroundColor: '#000',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: 'hidden',
      shadowColor: colors.shadow,
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
      resizeMode: 'contain',
      opacity: 0.9,
    },
    scanOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    scanLine: {
      width: '100%',
      height: 3,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
    },
    scanGlitch: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.accent,
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
      backgroundColor: colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: colors.accent,
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
      color: colors.secondary,
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
      color: colors.secondary,
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    totalValue: {
      fontSize: 48,
      fontWeight: '800',
      color: colors.primary,
    },
    unit: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.secondary,
    },
    macrosSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 20,
      marginTop: 16,
      ...SHADOWS.small,
    },
    macroItemHeader: {
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    macroValueHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    macroLabelHeader: {
      fontSize: 11,
      color: colors.secondary,
      fontWeight: '600',
      marginTop: 2,
    },
    macroDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },
    listContainer: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 16,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'transparent' : colors.border,
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
      color: colors.primary,
      marginBottom: 4,
    },
    itemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemDetail: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: '500',
    },
    itemMacroSplit: {
      fontSize: 12,
      color: colors.secondary,
      opacity: 0.8,
    },
    confidenceTag: {
      backgroundColor: '#F0F3F4',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    confidenceText: {
      fontSize: 10,
      color: colors.secondary,
      fontWeight: '600',
    },
    itemCalories: {
      alignItems: 'flex-end',
    },
    calorieCount: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    calorieLabel: {
      fontSize: 12,
      color: colors.secondary,
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
      color: colors.secondary,
      marginTop: 20,
      fontStyle: 'italic',
    },
    actionBar: {
      position: 'absolute',
      bottom: 10,
      left: 20,
      right: 20,
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    blurContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      padding: 8,
      backgroundColor:
        Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : undefined,
    },
    secondaryBtn: {
      flex: 0.4,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#FFF1F1',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: '#FFEFEF',
    },
    discardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    discardText: {
      color: colors.error,
      fontWeight: '700',
      fontSize: 15,
    },
    primaryBtn: {
      flex: 0.6,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      ...SHADOWS.medium,
    },
    disabledBtn: {
      opacity: 0.7,
    },
    primaryBtnText: {
      color: '#FFF',
      fontSize: 17,
      fontWeight: '700',
    },
  });

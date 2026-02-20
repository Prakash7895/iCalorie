import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getMealLog, MealLog, deleteLog } from '@/lib/api';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MealDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const { id, mealData } = useLocalSearchParams<{
    id: string;
    mealData?: string;
  }>();
  const [meal, setMeal] = useState<MealLog | null>(() => {
    if (mealData) {
      try {
        return JSON.parse(mealData) as MealLog;
      } catch (e) {
        console.warn('Failed to parse mealData prop', e);
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!mealData);

  useEffect(() => {
    async function fetchMeal() {
      if (!id || meal) return;
      try {
        const data = await getMealLog(id);
        setMeal(data);
      } catch (error) {
        console.warn('Error fetching meal:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [id, meal]);

  const handleDelete = async () => {
    if (!id || !meal) return;

    Alert.alert('Delete Meal Log?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLog(id);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete meal log');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.accent} />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color={colors.error} />
        <Text style={styles.errorText}>Meal details not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(meal.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.imageContainer}
        >
          {meal.photo_url ? (
            <Image
              source={{ uri: meal.photo_url }}
              style={styles.image}
              transition={200}
              cachePolicy='memory-disk'
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name='fast-food-outline'
                size={64}
                color='rgba(255,255,255,0.4)'
              />
            </View>
          )}
          <View style={styles.imageOverlay} />
        </Animated.View>

        <View style={styles.content}>
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.headerInfo}
          >
            <View>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
            <View style={styles.calorieBadge}>
              <Text style={styles.calorieValue}>
                {Math.round(meal.total_calories)}
              </Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.itemsSection}
          >
            <Text style={styles.sectionTitle}>Meal Breakdown</Text>
            {meal.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemIcon}>
                  <Ionicons
                    name='restaurant-outline'
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.grams && (
                    <Text style={styles.itemGrams}>{item.grams}g</Text>
                  )}
                </View>
                <Text style={styles.itemKcal}>
                  {Math.round(item.calories || 0)} kcal
                </Text>
              </View>
            ))}
          </Animated.View>

          {meal.plate_size_cm && (
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              style={styles.metaInfo}
            >
              <Ionicons
                name='expand-outline'
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.metaText}>
                Plate Reference: {meal.plate_size_cm}cm
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Custom Header */}
      <View
        style={[
          styles.customHeader,
          {
            paddingTop:
              Platform.OS === 'android' ? insets.top + 10 : insets.top,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={15}
          style={styles.headerBtnLeft}
        >
          <Ionicons name='chevron-back' size={28} color={colors.white} />
        </Pressable>

        <Text style={styles.headerTitleText}>Meal Details</Text>

        <View style={styles.headerRightActions}>
          <Pressable onPress={handleDelete} hitSlop={15}>
            <Ionicons name='trash-outline' size={24} color={colors.white} />
          </Pressable>

          <Pressable onPress={() => router.back()} hitSlop={15}>
            <Ionicons name='close' size={28} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.bg,
    },
    errorText: {
      fontSize: 18,
      color: colors.secondary,
      marginVertical: 16,
      fontWeight: '600',
    },
    backButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 28,
      ...SHADOWS.medium,
    },
    backButtonText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 16,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    customHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 10,
      zIndex: 100,
      elevation: 100,
    },
    headerBtnLeft: {
      width: 40,
      alignItems: 'center',
      marginLeft: Platform.OS === 'ios' ? 0 : 8,
    },
    headerTitleText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: '600',
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Platform.OS === 'ios' ? 16 : 20,
      marginRight: Platform.OS === 'ios' ? 0 : 8,
      width: 60,
      justifyContent: 'flex-end',
    },
    imageContainer: {
      width: '100%',
      height: 400,
      backgroundColor: colors.bg,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.accent,
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
      marginTop: -40,
      backgroundColor: colors.bg,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      padding: 24,
      minHeight: 500,
    },
    headerInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 4,
    },
    dateText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    timeText: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 4,
      fontWeight: '500',
    },
    calorieBadge: {
      alignItems: 'center',
      borderLeftWidth: 1,
      borderLeftColor: colors.bg,
      paddingLeft: 20,
    },
    calorieValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.accent,
    },
    calorieUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
    },
    itemsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.secondary,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    itemGrams: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 2,
      fontWeight: '500',
    },
    itemKcal: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    metaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.03)',
      padding: 12,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    metaText: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: '600',
    },
    floatingClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    floatingDelete: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      ...SHADOWS.large,
    },
  });

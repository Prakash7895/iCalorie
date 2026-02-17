import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getMealLog, MealLog } from '@/lib/api';
import { COLORS, SHADOWS } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<MealLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeal() {
      if (!id) return;
      try {
        const data = await getMealLog(id);
        setMeal(data);
      } catch (error) {
        console.error('Error fetching meal:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.accent} />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color={COLORS.error} />
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
          headerTitle: 'Meal Details',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: COLORS.white,
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
            <Image source={{ uri: meal.photo_url }} style={styles.image} />
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
                    color={COLORS.accent}
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
                color={COLORS.secondary}
              />
              <Text style={styles.metaText}>
                Plate Reference: {meal.plate_size_cm}cm
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Close button for non-stack navigation or just extra exit point */}
      <Pressable style={styles.floatingClose} onPress={() => router.back()}>
        <Ionicons name='close' size={24} color={COLORS.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.bg,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.secondary,
    marginVertical: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    ...SHADOWS.medium,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.accent,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    marginTop: -40,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    ...SHADOWS.medium,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  calorieBadge: {
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.bg,
    paddingLeft: 20,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.accent,
  },
  calorieUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
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
    color: COLORS.primary,
  },
  itemGrams: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  itemKcal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
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
    color: COLORS.secondary,
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
});

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { storage } from '@/lib/storage';

export default function FeaturesScreen() {
  const router = useRouter();

  const handleSkip = async () => {
    await storage.setOnboardingComplete();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <Pressable style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <Ionicons name='sparkles-outline' size={80} color={COLORS.accent} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
          AI-Powered Analysis
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(400)}
          style={styles.description}
        >
          Simply snap a photo of your meal and our AI instantly identifies foods
          and estimates calories with precision.
        </Animated.Text>

        {/* Feature List */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.features}>
          {[
            { icon: 'camera', text: 'Instant photo recognition' },
            { icon: 'analytics', text: 'Accurate calorie estimation' },
            { icon: 'time', text: 'Track your daily intake' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons
                name={feature.icon as any}
                size={24}
                color={COLORS.accent}
              />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom Navigation */}
      <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/(onboarding)/ready')}
        >
          <Text style={styles.nextText}>Next</Text>
          <Ionicons name='arrow-forward' size={20} color='#FFF' />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: 40,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.accent,
  },
  nextBtn: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

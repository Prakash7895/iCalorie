import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { storage } from '@/lib/storage';

export default function ReadyScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    await storage.setOnboardingComplete();
    router.replace('/(auth)/signup');
  };

  const handleLogin = async () => {
    await storage.setOnboardingComplete();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <Ionicons name='checkmark-circle' size={80} color={COLORS.accent} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
          Ready to Start?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(400)}
          style={styles.description}
        >
          Join thousands of users who are already tracking their nutrition
          effortlessly with iCalorie.
        </Animated.Text>
      </View>

      {/* Bottom Navigation */}
      <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Pressable style={styles.primaryBtn} onPress={handleGetStarted}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={handleLogin}>
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
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
  },
  footer: {
    padding: 40,
    gap: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
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
  primaryBtn: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

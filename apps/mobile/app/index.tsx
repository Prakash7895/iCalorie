import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SplashScreen() {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth status and navigate
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Show splash for 2 seconds

      const hasOnboarded = await storage.hasCompletedOnboarding();
      const isAuthenticated = await auth.isAuthenticated();

      if (!hasOnboarded) {
        router.replace('/(onboarding)/welcome');
      } else if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(tabs)');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name='nutrition' size={60} color='#FFF' />
        </View>
        <Text style={styles.title}>iCalorie</Text>
        <Text style={styles.subtitle}>AI-Powered Calorie Tracking</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});

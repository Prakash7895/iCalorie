import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';

import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storage } from '@/lib/storage';

// Must be called at the root so the Expo auth proxy redirect is handled
// regardless of which screen is currently active.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Restore dark mode preference on app launch
    const loadThemeSetting = async () => {
      const user = await storage.getUserData();
      if (user && user.dark_mode !== undefined) {
        Appearance.setColorScheme(user.dark_mode ? 'dark' : 'light');
      }
    };
    loadThemeSetting();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='index' />
        <Stack.Screen name='(onboarding)' />
        <Stack.Screen name='(auth)' />
        <Stack.Screen name='(tabs)' />
        <Stack.Screen
          name='modal'
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style='auto' />
    </ThemeProvider>
  );
}

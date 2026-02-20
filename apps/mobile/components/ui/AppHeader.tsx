import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

type AppHeaderProps = {
  title?: string;
  showBack?: boolean;
};

export function AppHeader({ title, showBack }: AppHeaderProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const segments = useSegments();

  // Automatically show back button if not on home screen
  const isHome = segments.length === 1 && segments[0] === '(tabs)';
  const shouldShowBack = showBack ?? !isHome;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {shouldShowBack && (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={24} color={colors.primary} />
          </Pressable>
        )}
        {title && (
          <Text style={[styles.title, shouldShowBack && styles.titleWithBack]}>
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      minHeight: 56,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    titleWithBack: {
      flex: 1,
    },
  });

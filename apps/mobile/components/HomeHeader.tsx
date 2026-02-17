import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import { COLORS, SHADOWS } from '@/constants/colors';

interface HomeHeaderProps {
  user: any;
  scrollY: SharedValue<number>;
  onProfilePress: () => void;
  onScanStatusPress: () => void;
}

const HEADER_MIN_HEIGHT = 95;

const HomeHeader = memo(
  ({ user, scrollY, onProfilePress, onScanStatusPress }: HomeHeaderProps) => {
    const hasBanner =
      user?.scans_remaining !== undefined && user.scans_remaining < 10;
    const HEADER_MAX_HEIGHT = hasBanner ? 190 : 130;
    const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
    const TOP_PADDING = hasBanner ? 55 : 15;

    const headerAnimatedStyle = useAnimatedStyle(() => {
      const height = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE],
        [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        Extrapolation.CLAMP
      );

      const paddingTop = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE],
        [35, TOP_PADDING],
        Extrapolation.CLAMP
      );

      return {
        height,
        paddingTop,
      };
    });

    const contentAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE * 0.5],
        [1, 0],
        Extrapolation.CLAMP
      );

      const translateY = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE],
        [0, -20],
        Extrapolation.CLAMP
      );

      return {
        opacity,
        transform: [{ translateY }],
      };
    });

    const subtitleContainerAnimatedStyle = useAnimatedStyle(() => {
      const height = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE * 0.5],
        [20, 0],
        Extrapolation.CLAMP
      );

      return {
        height,
        overflow: 'hidden',
      };
    });

    const titleAnimatedStyle = useAnimatedStyle(() => {
      const fontSize = interpolate(
        scrollY.value,
        [0, SCROLL_DISTANCE],
        [16, 24],
        Extrapolation.CLAMP
      );

      const fontWeight =
        interpolate(
          scrollY.value,
          [0, SCROLL_DISTANCE],
          [500, 700],
          Extrapolation.CLAMP
        ) > 600
          ? '700'
          : '500';

      return {
        fontSize,
        fontWeight: fontWeight as any,
      };
    });

    return (
      <Animated.View
        style={[styles.fixedHeader, headerAnimatedStyle]}
        pointerEvents='box-none'
      >
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <View style={styles.greetingTextContainer}>
              <Animated.Text style={[styles.greeting, titleAnimatedStyle]}>
                Welcome back!
              </Animated.Text>
              <Animated.View
                style={[contentAnimatedStyle, subtitleContainerAnimatedStyle]}
              >
                <Text style={styles.subtitle}>
                  Let's track your nutrition today
                </Text>
              </Animated.View>
            </View>
            <Pressable
              style={styles.fixedAvatarContainer}
              onPress={onProfilePress}
            >
              <View style={styles.fixedAvatar}>
                {user?.profile_picture_url ? (
                  <Image
                    source={{ uri: user.profile_picture_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name='person' size={24} color={COLORS.white} />
                )}
              </View>
            </Pressable>
          </View>

          <Animated.View style={contentAnimatedStyle}>
            {hasBanner && (
              <Pressable
                style={styles.scanStatusBanner}
                onPress={onScanStatusPress}
              >
                <View style={styles.scanBadge}>
                  <Ionicons name='flash' size={12} color={COLORS.accent} />
                  <Text style={styles.scanBadgeText}>
                    {user.scans_remaining}
                  </Text>
                </View>
                <Text style={styles.scanStatusText}>
                  AI Scans remaining. Tap to add more.
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  fixedHeader: {
    backgroundColor: COLORS.accent,
    paddingTop: 35,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.medium,
  },
  headerContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fixedAvatarContainer: {
    marginLeft: 16,
  },
  fixedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  scanStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scanBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  scanStatusText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
});

export default HomeHeader;

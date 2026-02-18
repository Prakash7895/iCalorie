import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/colors';

export default function CaptureScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        alert('Camera permission is required.');
        return;
      }
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        router.push({
          pathname: '/results',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Failed to open camera.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setLoading(true);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Gallery permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        selectionLimit: 1,
        legacy: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        router.push({
          pathname: '/results',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      alert('Failed to open gallery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name='sparkles' size={14} color='#FFF' />
          <Text style={styles.badgeText}>AI SCANNER</Text>
        </View>
        <Text style={styles.title}>Scan Your Meal</Text>
        <Text style={styles.subtitle}>
          Take a photo or pick from gallery to analyze nutrition
        </Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustration}>
        <View style={styles.iconCircle}>
          <Ionicons name='camera' size={64} color={COLORS.accent} />
        </View>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={takePhoto}
          disabled={loading}
        >
          <Ionicons name='camera' size={22} color='#FFF' />
          <Text style={styles.primaryBtnText}>Take Photo</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, loading && styles.disabledBtn]}
          onPress={pickImage}
          disabled={loading}
        >
          <Ionicons name='images-outline' size={22} color={COLORS.accent} />
          <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        You can crop and adjust the image before analysis
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${COLORS.accent}30`,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: '15%',
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: '15%',
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: '15%',
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
    borderBottomRightRadius: 8,
  },
  actions: {
    gap: 14,
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    borderRadius: 32,
    ...SHADOWS.medium,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${COLORS.accent}15`,
    paddingVertical: 18,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: `${COLORS.accent}40`,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  hint: {
    color: COLORS.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
});

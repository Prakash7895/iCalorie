import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { COLORS } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

export default function CaptureScreen() {
  const router = useRouter();
  const { autoCamera } = useLocalSearchParams<{ autoCamera?: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [autoLaunched, setAutoLaunched] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Animation values
  const focusScale = useSharedValue(1.2);
  const focusOpacity = useSharedValue(0.5);

  useFocusEffect(
    useCallback(() => {
      // Breathing animation for focus ring
      focusScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(1.1, { duration: 1000 })
        ),
        -1,
        true
      );
      focusOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        true
      );

      if (autoCamera === '1' && !autoLaunched) {
        setAutoLaunched(true);
        // Small delay to ensure camera is ready
        setTimeout(() => takePhoto(), 500);
      }
    }, [autoCamera, autoLaunched])
  );

  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
    opacity: focusOpacity.value,
  }));

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access gallery is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        selectionLimit: 1,
        legacy: true, // Use older intent for emulator compatibility
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        router.push({
          pathname: '/results',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      // Check for specific Android crash
      if (
        error instanceof Error &&
        error.message.includes('ActivityNotFoundException')
      ) {
        alert(
          'Gallery app not found. Please install Google Photos or Files app.'
        );
      } else {
        alert('Failed to open gallery.');
      }
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        alert('Permission to access camera is required.');
        return;
      }
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        router.push({
          pathname: '/results',
          params: { imageUri: photo.uri },
        });
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      alert('Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' />
      <CameraView ref={cameraRef} style={styles.camera} facing='back' />

      {/* Overlays positioned absolutely over the camera */}
      <View style={styles.overlayContainer}>
        {/* Top Overlay */}
        <BlurView intensity={20} tint='dark' style={styles.topBar}>
          <View style={styles.pillContainer}>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>AI SCANNER</Text>
            </View>
          </View>
        </BlurView>

        {/* Focus Ring */}
        <View style={styles.focusContainer}>
          <Animated.View style={[styles.focusRing, focusStyle]} />
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>

        <Text style={styles.hintText}>Center your meal</Text>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Button
            variant='icon'
            icon='images-outline'
            onPress={pickImage}
            style={styles.galleryBtn}
          />

          <View style={styles.captureContainer}>
            <Button
              onPress={takePhoto}
              style={styles.captureBtn}
              loading={isCapturing}
            >
              <View style={styles.innerCapture} />
            </Button>
          </View>

          <View style={styles.placeholderBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 20,
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  pillContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  activePill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activePillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  focusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  focusRing: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 4,
  },
  tl: {
    top: '25%',
    left: '15%',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  tr: {
    top: '25%',
    right: '15%',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bl: {
    bottom: '25%',
    left: '15%',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  br: {
    bottom: '25%',
    right: '15%',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  galleryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  captureContainer: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50,
    padding: 4,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  innerCapture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#CCC',
  },
  placeholderBtn: {
    width: 50,
  },
});

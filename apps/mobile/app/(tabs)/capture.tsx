import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#151515',
  overlay: '#1B1B1B',
  text: '#DCDCDC',
  button: '#333333',
  white: '#FFFFFF',
};

export default function CaptureScreen() {
  const router = useRouter();
  const { autoCamera } = useLocalSearchParams<{ autoCamera?: string }>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [autoLaunched, setAutoLaunched] = useState(false);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, useNativeDriver: true })
    ).start();
  }, [pulse]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusText('Media library permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setStatusText('Image selected');
      router.push({ pathname: '/results', params: { imageUri: uri } });
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const perm = await requestCameraPermission();
      if (!perm.granted) {
        setStatusText('Camera permission denied');
        return;
      }
    }

    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      setImageUri(photo.uri);
      router.push({ pathname: '/results', params: { imageUri: photo.uri } });
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (autoCamera === '1' && !autoLaunched) {
        setAutoLaunched(true);
        takePhoto();
      }
    }, [autoCamera, autoLaunched])
  );
  return (
    <View style={styles.screen}>
      <View style={styles.cameraView}>
        {cameraPermission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} />
        ) : (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionText}>Camera permission required</Text>
          </View>
        )}
        {showCalibrationPrompt ? (
          <View style={styles.calibrationCard}>
            <Text style={styles.calibrationTitle}>For most accurate results</Text>
            <Text style={styles.calibrationText}>
              Place a printed calibration card, a credit card, or a phone on the plate. Keep the
              full plate in frame. This improves portion estimates.
            </Text>
            <Pressable
              style={styles.calibrationButton}
              onPress={() => setShowCalibrationPrompt(false)}>
              <Text style={styles.calibrationButtonText}>Got it</Text>
            </Pressable>
            <Text style={styles.calibrationHint}>
              If you skip, we’ll use a standard plate size or your last plate size.
            </Text>
          </View>
        ) : null}
        <View style={styles.topBar}>
          <Text style={styles.cameraTitle}>Capture</Text>
          <View style={styles.topActions}>
            <View style={styles.pillChip}>
              <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
              <Text style={styles.pillText}>Auto</Text>
            </View>
            <View style={styles.pillChip}>
              <Ionicons name="color-filter-outline" size={16} color="#FFFFFF" />
              <Text style={styles.pillText}>AI</Text>
            </View>
          </View>
        </View>
        <Animated.View
          style={[
            styles.radarRing,
            {
              transform: [
                { scale: pulse },
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
        {statusText ? <Text style={styles.guideText}>{statusText}</Text> : null}
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.sideButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={18} color="#E6E6E6" />
          <Text style={styles.sideButtonText}>Import</Text>
        </Pressable>

        <Pressable style={styles.captureOuter} onPress={takePhoto}>
          <Animated.View style={[styles.capturePulse, { transform: [{ scale: pulse }] }]} />
          <View style={styles.captureInner} />
        </Pressable>

        <View style={styles.sideButtonGhost} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  cameraView: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 16,
  },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  calibrationCard: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 3,
    gap: 8,
  },
  calibrationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  calibrationText: {
    color: '#EAEAEA',
    fontSize: 13,
  },
  calibrationButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  calibrationButtonText: {
    color: '#111111',
    fontWeight: '600',
  },
  calibrationHint: {
    color: '#CFCFCF',
    fontSize: 11,
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  radarRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  permissionCard: {
    width: 260,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#232323',
  },
  permissionText: {
    color: COLORS.text,
    textAlign: 'center',
  },
  preview: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 90,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guideText: {
    color: COLORS.text,
    fontSize: 14,
  },
  bottomBar: {
    height: 130,
    backgroundColor: '#0E0E0E',
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideButton: {
    backgroundColor: COLORS.button,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideButtonGhost: {
    width: 86,
    height: 44,
  },
  sideButtonText: {
    color: COLORS.text,
  },
  captureOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturePulse: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.white,
  },
});

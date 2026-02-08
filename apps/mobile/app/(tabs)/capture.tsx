import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const COLORS = {
  bg: '#151515',
  overlay: '#1B1B1B',
  text: '#DCDCDC',
  button: '#333333',
  white: '#FFFFFF',
};

export default function CaptureScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Center your plate in the ring');

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusText('Media library permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setStatusText('Image selected');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setStatusText('Camera permission denied');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setStatusText('Photo captured');
      router.push('/results');
    }
  };
  return (
    <View style={styles.screen}>
      <View style={styles.cameraView}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={styles.plateRing} />
        )}
        <Text style={styles.guideText}>{statusText}</Text>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.sideButton} onPress={pickImage}>
          <Text style={styles.sideButtonText}>Import</Text>
        </Pressable>

        <Pressable style={styles.captureOuter} onPress={takePhoto}>
          <View style={styles.captureInner} />
        </Pressable>

        <Pressable style={styles.sideButton}>
          <Text style={styles.sideButtonText}>Flash</Text>
        </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  preview: {
    width: 320,
    height: 320,
    borderRadius: 20,
  },
  plateRing: {
    width: 320,
    height: 320,
    borderRadius: 200,
    borderWidth: 3,
    borderColor: '#BFBFBF',
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
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.white,
  },
});

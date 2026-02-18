import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { COLORS, SHADOWS } from '@/constants/colors';

const SCREEN = Dimensions.get('window');
const MIN_SIZE = 60;
const HANDLE_HIT = 50;

function clamp(val: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(val, min), max);
}

export default function CropScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [processing, setProcessing] = useState(false);

  // Natural image size and rendered image rect — plain state, set from JS events
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [viewSize, setViewSize] = useState({
    w: SCREEN.width,
    h: SCREEN.width,
  });

  // Mirror of rendered image rect as shared values for gesture worklets
  const imgX = useSharedValue(0);
  const imgY = useSharedValue(0);
  const imgW = useSharedValue(SCREEN.width);
  const imgH = useSharedValue(SCREEN.width);

  // Crop box shared values (in view/display coordinates)
  const bx = useSharedValue(SCREEN.width * 0.1);
  const by = useSharedValue(SCREEN.width * 0.1);
  const bw = useSharedValue(SCREEN.width * 0.8);
  const bh = useSharedValue(SCREEN.width * 0.8);

  // Gesture start snapshots
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);

  // useImageManipulator hook — takes the source URI
  const manipulator = useImageManipulator(imageUri as string);

  /** Called from JS thread (onLoad / onLayout) to compute rendered image rect */
  function updateImageRect(vw: number, vh: number, nw: number, nh: number) {
    if (nw <= 0 || nh <= 0 || vw <= 0 || vh <= 0) return;
    const scale = Math.min(vw / nw, vh / nh);
    const rw = nw * scale;
    const rh = nh * scale;
    const rx = (vw - rw) / 2;
    const ry = (vh - rh) / 2;

    imgX.value = rx;
    imgY.value = ry;
    imgW.value = rw;
    imgH.value = rh;

    // Reset crop box to 80% of rendered image
    bx.value = rx + rw * 0.1;
    by.value = ry + rh * 0.1;
    bw.value = rw * 0.8;
    bh.value = rh * 0.8;
  }

  // ── Move gesture ───────────────────────────────────────────────────────────
  const movePan = Gesture.Pan()
    .onStart(() => {
      sx.value = bx.value;
      sy.value = by.value;
    })
    .onUpdate((e) => {
      bx.value = clamp(
        sx.value + e.translationX,
        imgX.value,
        imgX.value + imgW.value - bw.value
      );
      by.value = clamp(
        sy.value + e.translationY,
        imgY.value,
        imgY.value + imgH.value - bh.value
      );
    });

  // ── Corner gestures ────────────────────────────────────────────────────────
  const tlPan = Gesture.Pan()
    .onStart(() => {
      sx.value = bx.value;
      sy.value = by.value;
      sw.value = bw.value;
      sh.value = bh.value;
    })
    .onUpdate((e) => {
      const newW = clamp(
        sw.value - e.translationX,
        MIN_SIZE,
        sx.value + sw.value - imgX.value
      );
      const newH = clamp(
        sh.value - e.translationY,
        MIN_SIZE,
        sy.value + sh.value - imgY.value
      );
      bx.value = sx.value + sw.value - newW;
      by.value = sy.value + sh.value - newH;
      bw.value = newW;
      bh.value = newH;
    });

  const trPan = Gesture.Pan()
    .onStart(() => {
      sx.value = bx.value;
      sy.value = by.value;
      sw.value = bw.value;
      sh.value = bh.value;
    })
    .onUpdate((e) => {
      const newW = clamp(
        sw.value + e.translationX,
        MIN_SIZE,
        imgX.value + imgW.value - sx.value
      );
      const newH = clamp(
        sh.value - e.translationY,
        MIN_SIZE,
        sy.value + sh.value - imgY.value
      );
      by.value = sy.value + sh.value - newH;
      bw.value = newW;
      bh.value = newH;
    });

  const blPan = Gesture.Pan()
    .onStart(() => {
      sx.value = bx.value;
      sy.value = by.value;
      sw.value = bw.value;
      sh.value = bh.value;
    })
    .onUpdate((e) => {
      const newW = clamp(
        sw.value - e.translationX,
        MIN_SIZE,
        sx.value + sw.value - imgX.value
      );
      const newH = clamp(
        sh.value + e.translationY,
        MIN_SIZE,
        imgY.value + imgH.value - sy.value
      );
      bx.value = sx.value + sw.value - newW;
      bw.value = newW;
      bh.value = newH;
    });

  const brPan = Gesture.Pan()
    .onStart(() => {
      sx.value = bx.value;
      sy.value = by.value;
      sw.value = bw.value;
      sh.value = bh.value;
    })
    .onUpdate((e) => {
      bw.value = clamp(
        sw.value + e.translationX,
        MIN_SIZE,
        imgX.value + imgW.value - sx.value
      );
      bh.value = clamp(
        sh.value + e.translationY,
        MIN_SIZE,
        imgY.value + imgH.value - sy.value
      );
    });

  // ── Animated styles ────────────────────────────────────────────────────────
  const boxStyle = useAnimatedStyle(() => ({
    left: bx.value,
    top: by.value,
    width: bw.value,
    height: bh.value,
  }));

  const maskTop = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: by.value,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));
  const maskBottom = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: by.value + bh.value,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));
  const maskLeft = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: by.value,
    width: bx.value,
    height: bh.value,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));
  const maskRight = useAnimatedStyle(() => ({
    position: 'absolute',
    top: by.value,
    height: bh.value,
    left: bx.value + bw.value,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  }));

  // ── Crop & navigate ────────────────────────────────────────────────────────
  const handleCrop = async () => {
    setProcessing(true);
    try {
      // Map display coords → natural image pixels
      // Subtract letterbox offset (imgX/imgY), then scale by natural/rendered ratio
      const scaleX = naturalSize.w / imgW.value;
      const scaleY = naturalSize.h / imgH.value;

      const cropX = Math.max(0, Math.round((bx.value - imgX.value) * scaleX));
      const cropY = Math.max(0, Math.round((by.value - imgY.value) * scaleY));
      const cropW = Math.min(
        naturalSize.w - cropX,
        Math.round(bw.value * scaleX)
      );
      const cropH = Math.min(
        naturalSize.h - cropY,
        Math.round(bh.value * scaleY)
      );

      console.log('[Crop] natural:', naturalSize.w, 'x', naturalSize.h);
      console.log(
        '[Crop] rendered:',
        imgW.value.toFixed(0),
        'x',
        imgH.value.toFixed(0),
        'offset:',
        imgX.value.toFixed(0),
        imgY.value.toFixed(0)
      );
      console.log(
        '[Crop] box (display):',
        bx.value.toFixed(0),
        by.value.toFixed(0),
        bw.value.toFixed(0),
        bh.value.toFixed(0)
      );
      console.log('[Crop] crop (pixels):', cropX, cropY, cropW, cropH);

      // Use new useImageManipulator API
      const imageRef = await manipulator
        .crop({ originX: cropX, originY: cropY, width: cropW, height: cropH })
        .renderAsync();

      const result = await imageRef.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.85,
      });

      router.replace({
        pathname: '/results',
        params: { imageUri: result.uri },
      });
    } catch (err) {
      console.error('[Crop] failed:', err);
      router.replace({ pathname: '/results', params: { imageUri } });
    }
  };

  const skipCrop = () =>
    router.replace({ pathname: '/results', params: { imageUri } });

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={skipCrop}>
            <Ionicons name='close' size={22} color='#FFF' />
          </Pressable>
          <Text style={styles.headerTitle}>Crop Photo</Text>
          <Pressable style={styles.headerBtn} onPress={skipCrop}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Image area */}
        <View
          style={styles.imageArea}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setViewSize({ w: width, h: height });
            updateImageRect(width, height, naturalSize.w, naturalSize.h);
          }}
        >
          <Image
            source={{ uri: imageUri as string }}
            style={styles.image}
            resizeMode='contain'
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              setNaturalSize({ w: width, h: height });
              updateImageRect(viewSize.w, viewSize.h, width, height);
            }}
          />

          {/* Dark masks outside crop box */}
          <Animated.View style={maskTop} pointerEvents='none' />
          <Animated.View style={maskBottom} pointerEvents='none' />
          <Animated.View style={maskLeft} pointerEvents='none' />
          <Animated.View style={maskRight} pointerEvents='none' />

          {/* Crop box — all gesture zones nested inside */}
          <Animated.View style={[styles.cropBox, boxStyle]}>
            <View style={styles.cropBorder} pointerEvents='none' />
            <View
              style={[styles.gridLine, styles.gridH1]}
              pointerEvents='none'
            />
            <View
              style={[styles.gridLine, styles.gridH2]}
              pointerEvents='none'
            />
            <View
              style={[styles.gridLine, styles.gridV1]}
              pointerEvents='none'
            />
            <View
              style={[styles.gridLine, styles.gridV2]}
              pointerEvents='none'
            />
            <View
              style={[styles.handleDot, styles.handleTL]}
              pointerEvents='none'
            />
            <View
              style={[styles.handleDot, styles.handleTR]}
              pointerEvents='none'
            />
            <View
              style={[styles.handleDot, styles.handleBL]}
              pointerEvents='none'
            />
            <View
              style={[styles.handleDot, styles.handleBR]}
              pointerEvents='none'
            />

            <GestureDetector gesture={movePan}>
              <View style={styles.moveZone} />
            </GestureDetector>
            <GestureDetector gesture={tlPan}>
              <View style={[styles.cornerZone, styles.cornerTL]} />
            </GestureDetector>
            <GestureDetector gesture={trPan}>
              <View style={[styles.cornerZone, styles.cornerTR]} />
            </GestureDetector>
            <GestureDetector gesture={blPan}>
              <View style={[styles.cornerZone, styles.cornerBL]} />
            </GestureDetector>
            <GestureDetector gesture={brPan}>
              <View style={[styles.cornerZone, styles.cornerBR]} />
            </GestureDetector>
          </Animated.View>
        </View>

        <Text style={styles.hint}>Drag corners or box to adjust crop</Text>

        <Pressable
          style={[styles.confirmBtn, processing && styles.disabledBtn]}
          onPress={handleCrop}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color='#FFF' />
          ) : (
            <>
              <Ionicons name='checkmark-circle' size={22} color='#FFF' />
              <Text style={styles.confirmText}>Crop & Analyze</Text>
            </>
          )}
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  skipText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },
  imageArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  image: { flex: 1, width: '100%' },
  cropBox: { position: 'absolute', overflow: 'visible' },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.3)' },
  gridH1: { left: 0, right: 0, top: '33.3%', height: 1 },
  gridH2: { left: 0, right: 0, top: '66.6%', height: 1 },
  gridV1: { top: 0, bottom: 0, left: '33.3%', width: 1 },
  gridV2: { top: 0, bottom: 0, left: '66.6%', width: 1 },
  handleDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFF',
    borderWidth: 3,
  },
  handleTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  handleTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  handleBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  handleBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  moveZone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  cornerZone: {
    position: 'absolute',
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    backgroundColor: 'transparent',
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 32,
    ...SHADOWS.medium,
  },
  disabledBtn: { opacity: 0.6 },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});

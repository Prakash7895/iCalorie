import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/colors';
import { auth } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// ────────────────────────────────────────────────────────────────────────────
// Animated focus-ring input
// ────────────────────────────────────────────────────────────────────────────
function FocusInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
  right?: React.ReactNode;
}) {
  const focused = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focused.value,
      [0, 1],
      ['#DFE6E9', COLORS.accent]
    ),
    borderWidth: withTiming(focused.value === 1 ? 2 : 1.5, { duration: 150 }),
  }));
  return (
    <Animated.View style={[styles.inputRow, anim]}>
      <Ionicons name={icon} size={18} color='#8E9AA0' />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor='#B2BEC3'
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={autoCorrect ?? false}
        onFocus={() => {
          focused.value = 1;
        }}
        onBlur={() => {
          focused.value = 0;
        }}
      />
      {right}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Signup Screen
// ────────────────────────────────────────────────────────────────────────────
export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await auth.signup(email, password, name);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style='light' translucent backgroundColor='transparent' />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Animated.View entering={FadeIn.delay(80)} style={styles.heroInner}>
          <View style={styles.logoBox}>
            <Ionicons name='nutrition' size={32} color='#fff' />
          </View>
          <Text style={styles.heroAppName}>Join iCalorie</Text>
          <Text style={styles.heroTagline}>Create your free account today</Text>
        </Animated.View>
      </View>

      {/* ── Scrollable form ───────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Create account ✨</Text>
            <Text style={styles.cardSub}>
              Join thousands tracking their goals
            </Text>

            {/* Google btn */}
            <GoogleSignInButton onError={setError} />

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orTxt}>or sign up with email</Text>
              <View style={styles.orLine} />
            </View>

            {/* Fields */}
            <View style={styles.fields}>
              <FocusInput
                icon='person-outline'
                placeholder='Full name'
                value={name}
                onChangeText={setName}
                autoCapitalize='words'
                autoCorrect={false}
              />
              <FocusInput
                icon='mail-outline'
                placeholder='Email address'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
              />
              <FocusInput
                icon='lock-closed-outline'
                placeholder='Password (min. 6 characters)'
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                right={
                  <Pressable onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                    <Ionicons
                      name={showPw ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color='#8E9AA0'
                    />
                  </Pressable>
                }
              />
              <FocusInput
                icon='shield-checkmark-outline'
                placeholder='Confirm password'
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPw}
              />
            </View>

            {!!error && (
              <Animated.View entering={FadeInDown} style={styles.errorBox}>
                <Ionicons name='alert-circle' size={14} color={COLORS.error} />
                <Text style={styles.errorTxt}>{error}</Text>
              </Animated.View>
            )}

            <Text style={styles.terms}>
              {'By signing up you agree to our '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' and '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>

            <Pressable
              style={[styles.btn, loading && styles.btnOff]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.btnTxt}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchTxt}>Already have an account?</Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.switchLink}> Sign In</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ACCENT = '#00B894';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF3F1' },
  flex: { flex: 1 },

  // ── Hero
  hero: {
    backgroundColor: ACCENT,
    paddingHorizontal: 28,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  heroInner: { zIndex: 1 },
  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroAppName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    marginTop: 4,
  },

  // ── Card
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#636E72',
    fontWeight: '500',
    marginBottom: 22,
  },

  // ── OR
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  orLine: { flex: 1, height: 1, backgroundColor: '#DFE6E9' },
  orTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E9AA0',
    letterSpacing: 0.3,
  },

  // ── Inputs
  fields: { gap: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#DFE6E9',
    gap: 10,
  },
  textInput: { flex: 1, fontSize: 15, color: '#2D3436', fontWeight: '500' },

  // ── Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  errorTxt: { color: '#FF7675', fontSize: 13, flex: 1, fontWeight: '500' },

  // ── Terms
  terms: {
    fontSize: 12,
    color: '#8E9AA0',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 18,
    marginBottom: 18,
  },
  termsLink: { color: ACCENT, fontWeight: '600' },

  // ── CTA
  btn: {
    backgroundColor: ACCENT,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  btnOff: { opacity: 0.7 },
  btnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  switchTxt: { fontSize: 14, color: '#636E72', fontWeight: '500' },
  switchLink: { fontSize: 14, color: ACCENT, fontWeight: '700' },
});

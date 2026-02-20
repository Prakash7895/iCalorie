import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

interface Props {
  onError?: (msg: string) => void;
}

// Official Google G icon rendered with Text spans per brand colors
function GoogleGIcon() {
  return (
    <View style={gIcon.wrap}>
      <Text style={gIcon.letter}>G</Text>
    </View>
  );
}

export default function GoogleSignInButton({ onError }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_ID,
    iosClientId: IOS_ID,
    androidClientId: ANDROID_ID,
    redirectUri: makeRedirectUri({
      native: 'com.icalorie.app:/oauth2redirect/google',
    }),
    selectAccount: true,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        handleToken(idToken);
      } else {
        onError?.('No ID token received from Google');
        setLoading(false);
      }
    } else if (response.type === 'error') {
      onError?.((response as any).error?.message ?? 'Google sign-in failed');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [response]);

  const handleToken = async (idToken: string) => {
    try {
      await auth.loginWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      onError?.(e.message ?? 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handlePress = async () => {
    if (!WEB_ID) {
      onError?.(
        'Google Client ID not configured — add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env'
      );
      return;
    }
    setLoading(true);
    await promptAsync();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.btnPressed,
        (!request || loading) && styles.btnDisabled,
      ]}
      onPress={handlePress}
      disabled={!request || loading}
    >
      {loading ? (
        <ActivityIndicator size='small' color='#4285F4' />
      ) : (
        <>
          <GoogleGIcon />
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const gIcon = StyleSheet.create({
  wrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  btnPressed: {
    backgroundColor: '#F8F9FA',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C4043', // official Google text color
    letterSpacing: 0.1,
  },
});

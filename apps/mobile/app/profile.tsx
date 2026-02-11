import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, SHADOWS } from '@/constants/colors';
import { storage } from '@/lib/storage';
import { auth } from '@/lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await storage.getUserData();
    setUser(userData);
    setName(userData?.name || '');
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const userData = await storage.getUserData();
    if (userData) {
      userData.name = name;
      await storage.setUserData(userData);
      setUser(userData);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await auth.logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name='arrow-back' size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.avatarSection}
        >
          <View style={styles.avatarLarge}>
            <Ionicons name='person' size={64} color={COLORS.white} />
          </View>
          <Pressable style={styles.editAvatarBtn}>
            <Ionicons name='camera' size={20} color={COLORS.accent} />
          </Pressable>
        </Animated.View>

        {/* User Info */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {/* Name */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name='person-outline'
                  size={20}
                  color={COLORS.accent}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                {editingName ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder='Enter your name'
                    placeholderTextColor={COLORS.secondary}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {user?.name || 'Not set'}
                  </Text>
                )}
              </View>
              {editingName ? (
                <Pressable onPress={handleSaveName}>
                  <Ionicons name='checkmark' size={24} color={COLORS.accent} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditingName(true)}>
                  <Ionicons name='pencil' size={20} color={COLORS.secondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name='mail-outline' size={20} color={COLORS.accent} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <Pressable style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons
                name='lock-closed-outline'
                size={20}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={COLORS.secondary}
            />
          </Pressable>

          <Pressable style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons
                name='notifications-outline'
                size={20}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={COLORS.secondary}
            />
          </Pressable>

          <Pressable style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name='shield-outline' size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={COLORS.secondary}
            />
          </Pressable>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name='log-out-outline' size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    padding: 0,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  logoutBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  Appearance,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { storage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { authenticatedFetch } from '@/lib/authFetch';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import NotificationsModal from '@/components/NotificationsModal';
import PrivacyModal from '@/components/PrivacyModal';
import { API_BASE_URL } from '@/lib/api';

export default function ProfileScreen() {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    // First, load from storage for immediate display (optimistic UI)
    const cachedUserData = await storage.getUserData();
    if (cachedUserData) {
      setUser(cachedUserData);
      setName(cachedUserData?.name || '');
    }

    // Always fetch fresh data from API to ensure latest profile picture, etc.
    try {
      const token = await storage.getAuthToken();
      if (!token) return;

      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);

      if (response.ok) {
        const freshUserData = await response.json();
        setUser(freshUserData);
        setName(freshUserData?.name || '');
        setCalorieGoal(String(freshUserData?.daily_calorie_goal || 2000));
        setIsDarkMode(freshUserData?.dark_mode || false);
        // Update storage with fresh data
        await storage.setUserData(freshUserData);
      }
    } catch (error) {
      console.warn('Error fetching fresh user data:', error);
      // Already have cached data displayed, so just log the error
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      await storage.setUserData(updatedUser);
      setUser(updatedUser);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update name. Please try again.');
      console.warn(error);
    }
  };

  const handleSaveGoal = async () => {
    const goalNum = parseInt(calorieGoal);
    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert(
        'Error',
        'Please enter a valid positive number for your goal'
      );
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ daily_calorie_goal: goalNum }),
        }
      );

      if (!response.ok) throw new Error('Failed to update goal');

      const updatedUser = await response.json();
      await storage.setUserData(updatedUser);
      setUser(updatedUser);
      setEditingGoal(false);
      Alert.alert('Success', 'Daily calorie goal updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);

    // Apply locally
    Appearance.setColorScheme(value ? 'dark' : 'light');

    // Sync to backend
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dark_mode: value }),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        console.log(updatedUser);
        await storage.setUserData(updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      // Revert if failed
      setIsDarkMode(!value);
      Appearance.setColorScheme(!value ? 'dark' : 'light');
      console.warn('Failed to sync dark mode preference:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Unable to open gallery. This may be an emulator issue. Try using the camera instead.'
      );
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      const formData = new FormData();

      // Get filename from URI
      const filename = uri.split('/').pop() || 'profile.jpg';

      formData.append('file', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/auth/profile-picture`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const updatedUser = await response.json();
      await storage.setUserData(updatedUser);
      setUser(updatedUser);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
      console.warn(error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open camera');
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
          <Ionicons name='arrow-back' size={24} color={colors.white} />
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
            {user?.profile_picture_url ? (
              <Image
                source={{ uri: user.profile_picture_url }}
                style={styles.avatarImage}
                transition={200}
                cachePolicy='memory-disk'
              />
            ) : (
              <Ionicons name='person' size={64} color={colors.white} />
            )}
          </View>
          <Pressable
            style={styles.editAvatarBtn}
            onPress={() => {
              Alert.alert('Profile Picture', 'Choose an option', [
                { text: 'Take Photo', onPress: handleTakePhoto },
                { text: 'Choose from Gallery', onPress: handlePickImage },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <Ionicons name='camera' size={20} color={colors.accent} />
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
                  color={colors.accent}
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
                    placeholderTextColor={colors.secondary}
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
                  <Ionicons name='checkmark' size={24} color={colors.accent} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditingName(true)}>
                  <Ionicons name='pencil' size={20} color={colors.secondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Calorie Goal */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name='flame-outline' size={20} color={colors.error} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Daily Calorie Goal</Text>
                {editingGoal ? (
                  <TextInput
                    style={styles.input}
                    value={calorieGoal}
                    onChangeText={setCalorieGoal}
                    placeholder='2000'
                    placeholderTextColor={colors.secondary}
                    keyboardType='numeric'
                    autoFocus
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {user?.daily_calorie_goal || 2000} kcal
                  </Text>
                )}
              </View>
              {editingGoal ? (
                <Pressable onPress={handleSaveGoal}>
                  <Ionicons name='checkmark' size={24} color={colors.accent} />
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditingGoal(true)}>
                  <Ionicons name='pencil' size={20} color={colors.secondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name='mail-outline' size={20} color={colors.accent} />
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

          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name='moon-outline' size={20} color={colors.accent} />
            </View>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>

          <Pressable
            style={styles.settingCard}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingIcon}>
              <Ionicons
                name='lock-closed-outline'
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={colors.secondary}
            />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => setShowNotificationsModal(true)}
          >
            <View style={styles.settingIcon}>
              <Ionicons
                name='notifications-outline'
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={colors.secondary}
            />
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => setShowPrivacyModal(true)}
          >
            <View style={styles.settingIcon}>
              <Ionicons name='shield-outline' size={20} color={colors.accent} />
            </View>
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={colors.secondary}
            />
          </Pressable>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name='log-out-outline' size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {}}
      />
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.accent,
      paddingTop: 50,
      paddingBottom: 16,
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
      color: colors.white,
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
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.medium,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 60, // Makes the image circular to match avatarLarge
    },
    editAvatarBtn: {
      position: 'absolute',
      bottom: 0,
      right: '35%',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.secondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    input: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      padding: 0,
    },
    settingCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    logoutBtn: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
  });

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authenticatedFetch } from '@/lib/authFetch';
import { storage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'expo-router';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const router = useRouter();
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteMealHistory = () => {
    Alert.alert(
      'Delete All Meal History',
      'This will permanently delete all your meal logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingHistory(true);
            try {
              const response = await authenticatedFetch(
                `${API_BASE_URL}/log/all`,
                { method: 'DELETE' }
              );
              if (!response.ok) throw new Error('Failed');
              Alert.alert('Done', 'All meal history has been deleted.');
            } catch {
              Alert.alert(
                'Error',
                'Failed to delete meal history. Please try again.'
              );
            } finally {
              setDeletingHistory(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and ALL associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Are you absolutely sure?',
              'Your account, meal logs, and all data will be gone forever.',
              [
                { text: 'No, Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      const response = await authenticatedFetch(
                        `${API_BASE_URL}/auth/account`,
                        { method: 'DELETE' }
                      );
                      if (!response.ok) throw new Error('Failed');
                      await auth.logout();
                      router.replace('/');
                    } catch {
                      Alert.alert(
                        'Error',
                        'Failed to delete account. Please try again.'
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  type ActionRowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string;
    iconColor: string;
    label: string;
    sublabel: string;
    onPress: () => void;
    loading?: boolean;
    destructive?: boolean;
  };

  const ActionRow = ({
    icon,
    iconBg,
    iconColor,
    label,
    sublabel,
    onPress,
    loading,
    destructive,
  }: ActionRowProps) => (
    <Pressable style={styles.actionRow} onPress={onPress} disabled={loading}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.actionContent}>
        <Text
          style={[styles.actionLabel, destructive && styles.destructiveText]}
        >
          {label}
        </Text>
        <Text style={styles.actionSublabel}>{sublabel}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size='small' color={colors.secondary} />
      ) : (
        <Ionicons name='chevron-forward' size={18} color={colors.secondary} />
      )}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name='shield-checkmark'
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View>
                <Text style={styles.title}>Privacy</Text>
                <Text style={styles.subtitle}>Manage your data</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name='close' size={20} color={colors.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Your Data */}
            <Text style={styles.sectionLabel}>YOUR DATA</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name='lock-closed' size={16} color={colors.accent} />
                <Text style={styles.infoText}>
                  iCalorie stores your data securely and never sells it to third
                  parties.
                </Text>
              </View>
            </View>

            {/* Data Rights */}
            <Text style={styles.sectionLabel}>DATA RIGHTS</Text>
            <View style={styles.card}>
              <ActionRow
                icon='document-text-outline'
                iconBg={`${colors.accent}18`}
                iconColor={colors.accent}
                label='Privacy Policy'
                sublabel='Read how we handle your data'
                onPress={() =>
                  Alert.alert(
                    'Privacy Policy',
                    'iCalorie collects only the data necessary to provide the service (meal logs, calorie goals, profile info). We never sell your data. All data is encrypted in transit and at rest.'
                  )
                }
              />
              <View style={styles.divider} />
              <ActionRow
                icon='download-outline'
                iconBg='#0984E318'
                iconColor='#0984E3'
                label='Export My Data'
                sublabel='Download a copy of all your data'
                onPress={() =>
                  Alert.alert(
                    'Export Data',
                    'Data export is coming soon! You will receive an email with your data within 24 hours once this feature launches.'
                  )
                }
              />
            </View>

            {/* Danger Zone */}
            <Text style={styles.sectionLabel}>DANGER ZONE</Text>
            <View style={styles.card}>
              <ActionRow
                icon='trash-outline'
                iconBg='#FF767518'
                iconColor={colors.error}
                label='Delete Meal History'
                sublabel='Remove all logged meals permanently'
                onPress={handleDeleteMealHistory}
                loading={deletingHistory}
                destructive
              />
              <View style={styles.divider} />
              <ActionRow
                icon='warning-outline'
                iconBg='#FF767518'
                iconColor={colors.error}
                label='Delete Account'
                sublabel='Permanently remove your account and data'
                onPress={handleDeleteAccount}
                loading={deletingAccount}
                destructive
              />
            </View>

            <Text style={styles.note}>
              All deletions are permanent and cannot be reversed.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      maxHeight: '85%',
      ...SHADOWS.large,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(0,0,0,0.12)',
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: `${colors.accent}18`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: '500',
      marginTop: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    scroll: {
      paddingHorizontal: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.secondary,
      letterSpacing: 0.8,
      marginTop: 16,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 20,
      fontWeight: '400',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionContent: {
      flex: 1,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    destructiveText: {
      color: colors.error,
    },
    actionSublabel: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.bg,
      marginLeft: 64,
    },
    note: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 8,
      marginHorizontal: 4,
    },
  });

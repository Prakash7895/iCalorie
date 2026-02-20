import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { authenticatedFetch } from '@/lib/authFetch';

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable onPress={onClose}>
              <Ionicons name='close' size={24} color={colors.secondary} />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder='Enter current password'
                placeholderTextColor={colors.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder='Enter new password (min 6 chars)'
                placeholderTextColor={colors.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder='Re-enter new password'
                placeholderTextColor={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.submitBtn]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Changing...' : 'Change Password'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    modalContent: {
      padding: 20,
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.bg,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.primary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalActions: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.bg,
    },
    submitBtn: {
      backgroundColor: colors.accent,
    },
    cancelBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.secondary,
    },
    submitBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
  });

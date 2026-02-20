import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitFeedback } from '@/lib/api';
import { SHADOWS } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({
  visible,
  onClose,
}: FeedbackModalProps) {
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(
        'Empty Message',
        'Please write your suggestion before submitting.'
      );
      return;
    }

    setLoading(true);
    try {
      await submitFeedback(message.trim());
      Alert.alert(
        '🙏 Thank You!',
        'Your feedback has been received. We really appreciate you taking the time to share!',
        [
          {
            text: 'Great!',
            onPress: () => {
              setMessage('');
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Feedback submit error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send feedback. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name='chatbubble-ellipses'
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View>
                <Text style={styles.title}>Share Feedback</Text>
                <Text style={styles.subtitle}>Help us improve iCalorie</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={22} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Textarea */}
          <TextInput
            style={styles.textarea}
            placeholder={
              'What feature do you want in this app?\nWhat do you like about it?\nWhat can we improve?\n\nShare your thoughts here...'
            }
            placeholderTextColor='rgba(0,0,0,0.3)'
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical='top'
            autoFocus
            maxLength={2000}
          />

          {/* Character count */}
          <Text style={styles.charCount}>{message.length}/2000</Text>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name='send' size={18} color={colors.white} />
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: `${colors.accent}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      lineHeight: 22,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.secondary,
      marginTop: 1,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textarea: {
      backgroundColor: colors.bg,
      borderRadius: 18,
      padding: 16,
      fontSize: 15,
      lineHeight: 22,
      color: colors.primary,
      fontWeight: '500',
      minHeight: 140,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
    },
    charCount: {
      fontSize: 12,
      color: colors.secondary,
      textAlign: 'right',
      marginTop: 6,
      marginBottom: 16,
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: colors.accent,
      height: 54,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledButton: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: colors.white,
      fontSize: 17,
      fontWeight: '700',
    },
  });

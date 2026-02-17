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
import { BlurView } from 'expo-blur';
import { saveLog } from '@/lib/api';
import { COLORS, SHADOWS } from '@/constants/colors';

interface ManualLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualLogModal({
  visible,
  onClose,
  onSuccess,
}: ManualLogModalProps) {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your meal.');
      return;
    }
    if (!calories || isNaN(Number(calories))) {
      Alert.alert(
        'Invalid Calories',
        'Please enter a valid number for calories.'
      );
      return;
    }

    setLoading(true);
    try {
      await saveLog({
        items: [{ name: mealName.trim(), calories: Number(calories) }],
        total_calories: Number(calories),
        created_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setMealName('');
            setCalories('');
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Manual log error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save log. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='fade'
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Manual Log</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meal Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='restaurant-outline'
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder='e.g. Chicken Salad'
                  placeholderTextColor='rgba(0,0,0,0.3)'
                  value={mealName}
                  onChangeText={setMealName}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Calories</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name='flame-outline'
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder='0'
                  placeholderTextColor='rgba(0,0,0,0.3)'
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType='numeric'
                />
                <Text style={styles.unitText}>kcal</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                  <Ionicons
                    name='checkmark-circle'
                    size={20}
                    color={COLORS.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    ...SHADOWS.medium,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

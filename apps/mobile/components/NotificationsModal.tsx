import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS } from '@/constants/colors';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

const NOTIF_KEY = 'notifications_settings';

type NotifSettings = {
  mealReminders: boolean;
  morningReminder: boolean;
  lunchReminder: boolean;
  dinnerReminder: boolean;
  weeklySummary: boolean;
  goalAlerts: boolean;
};

const DEFAULT_SETTINGS: NotifSettings = {
  mealReminders: true,
  morningReminder: true,
  lunchReminder: true,
  dinnerReminder: true,
  weeklySummary: true,
  goalAlerts: true,
};

export default function NotificationsModal({
  visible,
  onClose,
}: NotificationsModalProps) {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {
      // use defaults
    }
  };

  const updateSetting = async <K extends keyof NotifSettings>(
    key: K,
    value: NotifSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };

    // If master mealReminders is turned off, disable all sub-reminders
    if (key === 'mealReminders' && !value) {
      updated.morningReminder = false;
      updated.lunchReminder = false;
      updated.dinnerReminder = false;
    }
    // If a sub-reminder is turned on, ensure master is on
    if (
      (key === 'morningReminder' ||
        key === 'lunchReminder' ||
        key === 'dinnerReminder') &&
      value
    ) {
      updated.mealReminders = true;
    }

    setSettings(updated);
    try {
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    } catch {
      // silent
    }
  };

  type RowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    label: string;
    sublabel?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    indent?: boolean;
  };

  const Row = ({
    icon,
    iconColor = COLORS.accent,
    label,
    sublabel,
    value,
    onChange,
    indent = false,
  }: RowProps) => (
    <View style={[styles.row, indent && styles.rowIndent]}>
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.accent }}
        thumbColor={COLORS.white}
        ios_backgroundColor={COLORS.border}
      />
    </View>
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
                  name='notifications'
                  size={20}
                  color={COLORS.accent}
                />
              </View>
              <View>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Manage your alerts</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name='close' size={20} color={COLORS.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Meal Reminders Section */}
            <Text style={styles.sectionLabel}>MEAL REMINDERS</Text>
            <View style={styles.card}>
              <Row
                icon='restaurant'
                label='Meal Reminders'
                sublabel='Get reminded to log your meals'
                value={settings.mealReminders}
                onChange={(v) => updateSetting('mealReminders', v)}
              />
              <View style={styles.divider} />
              <Row
                icon='sunny-outline'
                iconColor='#FDCB6E'
                label='Morning (8:00 AM)'
                value={settings.morningReminder}
                onChange={(v) => updateSetting('morningReminder', v)}
                indent
              />
              <View style={styles.divider} />
              <Row
                icon='partly-sunny-outline'
                iconColor='#F0932B'
                label='Lunch (1:00 PM)'
                value={settings.lunchReminder}
                onChange={(v) => updateSetting('lunchReminder', v)}
                indent
              />
              <View style={styles.divider} />
              <Row
                icon='moon-outline'
                iconColor='#6C5CE7'
                label='Dinner (7:00 PM)'
                value={settings.dinnerReminder}
                onChange={(v) => updateSetting('dinnerReminder', v)}
                indent
              />
            </View>

            {/* Progress Section */}
            <Text style={styles.sectionLabel}>PROGRESS</Text>
            <View style={styles.card}>
              <Row
                icon='bar-chart'
                iconColor='#0984E3'
                label='Weekly Summary'
                sublabel='Get a weekly nutrition recap every Sunday'
                value={settings.weeklySummary}
                onChange={(v) => updateSetting('weeklySummary', v)}
              />
              <View style={styles.divider} />
              <Row
                icon='trophy-outline'
                iconColor='#00B894'
                label='Goal Alerts'
                sublabel="Notify when you're close to your daily goal"
                value={settings.goalAlerts}
                onChange={(v) => updateSetting('goalAlerts', v)}
              />
            </View>

            <Text style={styles.note}>
              ℹ️ Note: Push notification delivery requires system permissions.
              Go to your device Settings → iCalorie to enable them.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.bg,
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
    backgroundColor: `${COLORS.accent}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIndent: {
    paddingLeft: 24,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rowSublabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bg,
    marginLeft: 64,
  },
  note: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 4,
    lineHeight: 18,
  },
});

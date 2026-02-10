import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getLog } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#F6F1EA',
  card: '#FFFFFF',
  text: '#1F1F1F',
  muted: '#6D6D6D',
  accent: '#1E7A5D',
  accentSoft: '#E0F3EA',
  line: '#E4DED6',
};

type LogItem = {
  items?: { name: string; calories?: number }[];
  total_calories?: number;
  created_at?: string;
};

export default function LogScreen() {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const spin = useRef(new Animated.Value(0)).current;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    Animated.timing(spin, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
      spin.setValue(0);
    });
    try {
      const data = await getLog(today);
      setLogs(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to load log');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Today</Text>
        <Pressable style={styles.refresh} onPress={fetchLog}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}>
            <Ionicons name="refresh" size={18} color={COLORS.accent} />
          </Animated.View>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading log...</Text>
        </View>
      ) : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {logs.length === 0 && !loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.body}>No meals logged yet.</Text>
          <Text style={styles.muted}>Scan a meal to see it here.</Text>
        </View>
      ) : null}

      {logs.map((log, idx) => (
        <View key={idx} style={styles.logCard}>
          <Text style={styles.sectionTitle}>Meal {idx + 1}</Text>
          <Text style={styles.muted}>{log.total_calories ?? 0} kcal</Text>
          <View style={styles.divider} />
          {(log.items || []).map((item, i) => (
            <View key={`${item.name}-${i}`} style={styles.row}>
              <Text style={styles.body}>{item.name}</Text>
              <Text style={styles.muted}>{item.calories ?? 0} kcal</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  refresh: {
    backgroundColor: COLORS.accentSoft,
    padding: 10,
    borderRadius: 999,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#C24848',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    color: COLORS.text,
  },
  muted: {
    color: COLORS.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
  },
});

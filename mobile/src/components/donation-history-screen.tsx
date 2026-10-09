import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const palette = {
  canvas: '#F7F8FF',
  surface: '#FFFFFF',
  ink: '#14253B',
  muted: '#6E7180',
  border: '#D6DDEA',
  red: '#E7194F',
  blue: '#0878A8',
};

export function DonationHistoryScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <ThemedText
          onPress={() => router.back()}
          style={styles.backButton}
        >
          ‹
        </ThemedText>

        <View style={styles.titleContainer}>
          <ThemedText type="subtitle" style={styles.title}>
            Donation History
          </ThemedText>

          <ThemedText type="small" style={styles.subtitle}>
            Your blood donation records
          </ThemedText>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <ThemedText type="small" style={styles.summaryLabel}>
          Total Donations
        </ThemedText>

        <ThemedText type="title" style={styles.total}>
          0
        </ThemedText>

        <ThemedText type="small" style={styles.summaryText}>
          No completed donations recorded yet.
        </ThemedText>
      </View>

      <View style={styles.emptyCard}>
        <View style={styles.iconCircle}>
          <ThemedText style={styles.icon}>🩸</ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No Donation History Yet
        </ThemedText>

        <ThemedText type="small" style={styles.emptyText}>
          Your donation records will appear here when donations are
          recorded in the LifeLink system.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.canvas,
    paddingHorizontal: Spacing.three,
    paddingTop: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    fontSize: 36,
    lineHeight: 40,
    color: palette.ink,
    width: 40,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },

  title: {
    color: palette.red,
    fontSize: 22,
  },

  subtitle: {
    color: palette.muted,
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },

  summaryLabel: {
    color: palette.muted,
  },

  total: {
    color: palette.ink,
    fontSize: 36,
    marginVertical: 4,
  },

  summaryText: {
    color: palette.muted,
  },

  emptyCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 230,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  icon: {
    fontSize: 28,
  },

  emptyTitle: {
    color: palette.ink,
    textAlign: 'center',
  },

  emptyText: {
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});
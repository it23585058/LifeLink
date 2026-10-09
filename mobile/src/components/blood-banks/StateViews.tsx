import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppIcon } from './AppIcon';

export function LoadingView({ message = 'Loading live network data...' }: { message?: string }) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#E7194F" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function EmptyView({
  title = 'No Facilities Found',
  message = 'No hospitals or blood banks match your current filter criteria.',
  onReset,
}: {
  title?: string;
  message?: string;
  onReset?: () => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.iconCircle}>
        <AppIcon name="hospital" size={32} tintColor="#6E7180" />
      </View>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.messageText}>{message}</Text>
      {onReset && (
        <Pressable
          style={styles.actionButton}
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Reset filter"
        >
          <Text style={styles.actionButtonText}>Reset Filter</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ErrorView({
  message = 'Failed to load network data. Check connection and retry.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <View style={[styles.iconCircle, { backgroundColor: '#FFE7EE' }]}>
        <AppIcon name="warning" size={32} tintColor="#E7194F" />
      </View>
      <Text style={styles.titleText}>Connection Error</Text>
      <Text style={styles.messageText}>{message}</Text>
      <Pressable
        style={[styles.actionButton, { backgroundColor: '#E7194F' }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading data"
      >
        <Text style={styles.actionButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6E7180',
    fontWeight: '500',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 6,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 13,
    color: '#6E7180',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    maxWidth: 280,
  },
  actionButton: {
    backgroundColor: '#0878A8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

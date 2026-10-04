import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { apiHealth } from '@/lib/api';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type HealthState = 'checking' | 'connected' | 'error';

export function ApiHealthCheck() {
  const [healthState, setHealthState] = useState<HealthState>('checking');

  const checkHealth = async () => {
    setHealthState('checking');
    try {
      const result = await apiHealth();
      setHealthState(result.status === 'ok' && result.database === 'connected' ? 'connected' : 'error');
    } catch {
      setHealthState('error');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const statusText = {
    checking: 'Checking API connection...',
    connected: 'API connected to LifeLink database',
    error: 'API unavailable. Check the backend and phone network.',
  }[healthState];

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="small">{statusText}</ThemedText>
      <Pressable onPress={checkHealth} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText type="link">Retry</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
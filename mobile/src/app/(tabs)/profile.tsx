import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { donorSession } from '@/lib/donor-session';
import { DonorProfileScreen } from '@/components/donor-profile-screen';
import { ThemedText } from '@/components/themed-text';

export default function ProfileTabRoute() {
  const { donorId: paramDonorId } = useLocalSearchParams<{ donorId?: string }>();
  const [donorId, setDonorId] = useState<string | null>(paramDonorId ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSessionError(null);

    void donorSession.get()
      .then((savedDonorId) => {
        if (cancelled) return;
        setDonorId(paramDonorId ?? savedDonorId);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSessionError('Could not restore your donor session. Please try again.');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paramDonorId]);

  if (isLoading) {
    return <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#E7194F" /></View>;
  }

  if (!donorId) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }}>
        <ThemedText>
          {sessionError ?? 'No authenticated donor session was found.'}
        </ThemedText>
      </View>
    );
  }

  return <DonorProfileScreen />;
}

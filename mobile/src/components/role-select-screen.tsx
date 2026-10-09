import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  redSoft: '#FFE7EE',
};

type Role = {
  key: string;
  title: string;
  description: string;
  // undefined = not built yet (other team members' parts)
  href?: Href;
};

const ROLES: Role[] = [
  { key: 'donor', title: 'Donor', description: 'Register to donate blood', href: '/donor-register' },
  { key: 'recipient', title: 'Recipient', description: 'Request blood for a patient', href: '/recipient-auth' },
  { key: 'volunteer', title: 'Volunteer', description: 'Help coordinate donations' },
  { key: 'hospital', title: 'Hospital', description: 'Manage blood requests', href: '/hospital-login' },
];

export function RoleSelectScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.heading}>I am a...</ThemedText>
          <ThemedText type="small" style={styles.subHeading}>Choose how you want to use LifeLink.</ThemedText>

          <View style={styles.grid}>
            {ROLES.map((role) => {
              const enabled = Boolean(role.href);
              return (
                <Pressable
                  key={role.key}
                  disabled={!enabled}
                  onPress={() => role.href && router.push(role.href)}
                  accessibilityRole="button"
                  accessibilityLabel={role.title}
                  style={[styles.card, !enabled && styles.cardDisabled]}>
                  <ThemedText style={styles.cardTitle}>{role.title}</ThemedText>
                  <ThemedText type="small" style={styles.cardText}>{role.description}</ThemedText>
                  {!enabled && <ThemedText type="small" style={styles.soon}>Coming soon</ThemedText>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.canvas, flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, gap: Spacing.two, justifyContent: 'center', padding: Spacing.three },
  heading: { color: palette.red, fontSize: 28, lineHeight: 34 },
  subHeading: { color: palette.muted, marginBottom: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: 150,
    padding: Spacing.three,
    width: '47%',
  },
  cardDisabled: { opacity: 0.55 },
  cardTitle: { color: palette.ink, fontSize: 20, fontWeight: '700' },
  cardText: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  soon: { color: palette.red, fontSize: 11, fontWeight: '600', marginTop: Spacing.one },
});

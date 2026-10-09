import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const palette = {
  canvas: '#F7F8FF',
  surface: '#FFFFFF',
  ink: '#14253B',
  muted: '#6E7180',
  border: '#D6DDEA',
  red: '#E7194F',
  redSoft: '#FFE7EE',
  blue: '#0878A8',
  blueSoft: '#E6F4FF',
};

type DashboardCard = {
  title: string;
  description: string;
  route: '/' | '/emergency-feed' | '/donor-register' | '/donor-login' | '/donor-home' | '/donor-profile' | '/donor-medical' | '/donation-history' | '/blood-banks' | '/blood-banks/reservations' | '/transfers/new' | '/role-select';
  tone: 'red' | 'blue' | 'neutral';
};

const cards: DashboardCard[] = [
  { title: 'Find Donors', description: 'Search real donor profiles by blood group, city, and availability.', route: '/', tone: 'red' },
  { title: 'Emergency Feed', description: 'Review open blood requests and respond to urgent dispatches.', route: '/emergency-feed', tone: 'red' },
  { title: 'Blood Banks', description: 'Browse hospitals, blood inventory, shortages, and hospital details.', route: '/blood-banks', tone: 'blue' },
  { title: 'Reservations', description: 'View and manage blood reservations linked to your demo session.', route: '/blood-banks/reservations', tone: 'blue' },
  { title: 'Start Transfer', description: 'Create a blood transfer after selecting a hospital and inventory.', route: '/transfers/new', tone: 'blue' },
  { title: 'Register as Donor', description: 'Join the verified LifeLink donor network.', route: '/donor-register', tone: 'neutral' },
  { title: 'Donor Login', description: 'Sign in to access your donor dashboard and profile.', route: '/donor-login', tone: 'neutral' },
  { title: 'Donor Dashboard', description: 'Open donor availability, alerts, and profile actions.', route: '/donor-home', tone: 'neutral' },
  { title: 'Donor Profile', description: 'Review and update donor information and availability.', route: '/donor-profile', tone: 'neutral' },
  { title: 'Medical Documents', description: 'View or upload donor medical documents.', route: '/donor-medical', tone: 'neutral' },
  { title: 'Donation History', description: 'Review recorded donation history.', route: '/donation-history', tone: 'neutral' },
  { title: 'Choose Role', description: 'Open the existing role selection flow.', route: '/role-select', tone: 'neutral' },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle" style={styles.heading}>LifeLink</ThemedText>
          <ThemedText type="small" style={styles.intro}>
            Blood donation and emergency coordination in one place.
          </ThemedText>

          <View style={styles.grid}>
            {cards.map((card) => (
              <Pressable
                key={card.route}
                accessibilityRole="button"
                accessibilityLabel={card.title}
                onPress={() => router.push(card.route)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={[styles.cardAccent, styles[`${card.tone}Accent`]]} />
                <ThemedText type="smallBold" style={styles.cardTitle}>{card.title}</ThemedText>
                <ThemedText type="small" style={styles.cardDescription}>{card.description}</ThemedText>
                <ThemedText type="smallBold" style={[styles.openLabel, styles[`${card.tone}Label`]]}>Open</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.canvas, flex: 1 },
  safeArea: { flex: 1 },
  content: { gap: Spacing.two, padding: Spacing.three, paddingBottom: 120 },
  heading: { color: palette.red, fontSize: 30, lineHeight: 36 },
  intro: { color: palette.muted, marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.one,
    minHeight: 155,
    overflow: 'hidden',
    padding: Spacing.three,
    width: '48%',
  },
  cardAccent: { borderRadius: 3, height: 5, marginBottom: Spacing.one, width: 34 },
  redAccent: { backgroundColor: palette.red },
  blueAccent: { backgroundColor: palette.blue },
  neutralAccent: { backgroundColor: palette.ink },
  cardTitle: { color: palette.ink, fontSize: 16 },
  cardDescription: { color: palette.muted, flex: 1, fontSize: 12, lineHeight: 17 },
  openLabel: { fontSize: 12 },
  redLabel: { color: palette.red },
  blueLabel: { color: palette.blue },
  neutralLabel: { color: palette.ink },
  pressed: { opacity: 0.75 },
});

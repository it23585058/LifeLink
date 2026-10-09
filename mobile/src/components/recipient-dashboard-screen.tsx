import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { donorSession } from '@/lib/donor-session';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function RecipientDashboardScreen() {
  const router = useRouter();
  useEffect(() => {
    void donorSession.getRole().then((role) => {
      if (role !== 'recipient') router.replace('/role-select');
    });
  }, [router]);
  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safe}><View style={styles.content}><ThemedText type="subtitle" style={styles.title}>Recipient Dashboard</ThemedText><ThemedText style={styles.muted}>Create and track blood requests for your patient.</ThemedText><Pressable onPress={() => router.push('/recipient-profile')} style={styles.card}><ThemedText type="smallBold" style={styles.cardTitle}>Recipient Profile</ThemedText><ThemedText style={styles.muted}>View or update your account details.</ThemedText></Pressable><Pressable onPress={() => router.push('/request')} style={styles.primary}><ThemedText type="smallBold" style={styles.primaryText}>Create blood request</ThemedText></Pressable><Pressable onPress={() => router.push('/emergency-feed')} style={styles.card}><ThemedText type="smallBold" style={styles.cardTitle}>View emergency feed</ThemedText><ThemedText style={styles.muted}>See current blood availability and requests.</ThemedText></Pressable><Pressable onPress={() => { void donorSession.clear(); router.replace('/landing'); }}><ThemedText style={styles.logout}>Log out</ThemedText></Pressable></View></SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F7F8FF' }, safe: { flex: 1 }, content: { padding: Spacing.four }, title: { color: '#14253B', fontSize: 28 }, muted: { color: '#6E7180', lineHeight: 22, marginTop: Spacing.two }, primary: { alignItems: 'center', backgroundColor: '#E7194F', borderRadius: 12, marginTop: Spacing.four, padding: Spacing.three }, primaryText: { color: '#FFF' }, card: { backgroundColor: '#FFF', borderColor: '#D6DDEA', borderRadius: 12, borderWidth: 1, marginTop: Spacing.three, padding: Spacing.three }, cardTitle: { color: '#14253B' }, logout: { color: '#B42318', marginTop: Spacing.five, textAlign: 'center' } });

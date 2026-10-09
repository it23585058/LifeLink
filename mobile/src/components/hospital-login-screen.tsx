import axios from 'axios';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { roleAuthApi } from '@/lib/role-auth-api';
import { donorSession } from '@/lib/donor-session';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function HospitalLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) return setError('Email and password are required.');
    setLoading(true);
    try {
      const result = await roleAuthApi.loginHospital(email, password);
      await donorSession.saveSession(result.staff._id, result.token, 'hospital_staff');
      router.replace('/hospital-dashboard');
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'Unable to sign in as hospital staff.' : 'Unable to sign in as hospital staff.');
    } finally {
      setLoading(false);
    }
  };

  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safe}><View style={styles.content}><Pressable onPress={() => router.back()}><ThemedText style={styles.back}>‹ Back</ThemedText></Pressable><ThemedText type="subtitle" style={styles.title}>Hospital Staff Login</ThemedText><ThemedText style={styles.muted}>Use a provisioned hospital staff account. Public staff registration is not available.</ThemedText><ThemedText type="smallBold" style={styles.label}>Email</ThemedText><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Staff email" placeholderTextColor="#8A8F9C" style={styles.input} /><ThemedText type="smallBold" style={styles.label}>Password</ThemedText><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#8A8F9C" style={styles.input} />{error && <ThemedText style={styles.error}>{error}</ThemedText>}<Pressable onPress={() => void submit()} style={styles.submit}>{loading ? <ActivityIndicator color="#FFF" /> : <ThemedText type="smallBold" style={styles.submitText}>Log in</ThemedText>}</Pressable></View></SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F7F8FF' }, safe: { flex: 1 }, content: { padding: Spacing.four }, back: { color: '#E7194F', marginBottom: Spacing.four }, title: { color: '#14253B', fontSize: 28 }, muted: { color: '#6E7180', lineHeight: 22, marginVertical: Spacing.three }, label: { color: '#14253B', marginTop: Spacing.three, marginBottom: Spacing.one }, input: { backgroundColor: '#FFF', borderColor: '#D6DDEA', borderRadius: 12, borderWidth: 1, color: '#14253B', minHeight: 48, paddingHorizontal: Spacing.three }, error: { color: '#B42318', marginTop: Spacing.three }, submit: { alignItems: 'center', backgroundColor: '#0878A8', borderRadius: 12, justifyContent: 'center', marginTop: Spacing.four, minHeight: 50 }, submitText: { color: '#FFF' } });

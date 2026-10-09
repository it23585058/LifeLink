import axios from 'axios';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { roleAuthApi } from '@/lib/role-auth-api';
import { donorSession } from '@/lib/donor-session';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function RecipientAuthScreen() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password || (registering && (!name.trim() || !phone.trim() || !city.trim()))) {
      setError('Complete all required fields.');
      return;
    }
    setLoading(true);
    try {
      const result = registering
        ? await roleAuthApi.registerRecipient({ name, phone, city, email, password })
        : await roleAuthApi.loginRecipient(email, password);
      await donorSession.saveSession(result.recipient._id, result.token, 'recipient');
      router.replace('/recipient-dashboard');
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'Unable to complete recipient authentication.' : 'Unable to complete recipient authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()}><ThemedText style={styles.back}>‹ Back</ThemedText></Pressable>
          <ThemedText type="subtitle" style={styles.title}>{registering ? 'Recipient Registration' : 'Recipient Login'}</ThemedText>
          <ThemedText style={styles.muted}>Request blood for a patient using your verified recipient account.</ThemedText>
          {registering && <><Field label="Full name" value={name} onChangeText={setName} /><Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><Field label="City" value={city} onChangeText={setCity} /></>}
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          <Pressable onPress={() => void submit()} disabled={loading} style={styles.submit}>{loading ? <ActivityIndicator color="#FFF" /> : <ThemedText type="smallBold" style={styles.submitText}>{registering ? 'Create recipient account' : 'Log in'}</ThemedText>}</Pressable>
          <Pressable onPress={() => setRegistering((value) => !value)}><ThemedText style={styles.link}>{registering ? 'Already registered? Log in' : 'New recipient? Register'}</ThemedText></Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'phone-pad' | 'email-address'; secureTextEntry?: boolean }) {
  return <View style={styles.field}><ThemedText type="smallBold" style={styles.label}>{label}</ThemedText><TextInput {...props} placeholder={label} placeholderTextColor="#8A8F9C" autoCapitalize="none" style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FF' },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 48 },
  back: { color: '#E7194F', marginBottom: Spacing.four },
  title: { color: '#14253B', fontSize: 28 },
  muted: { color: '#6E7180', lineHeight: 22, marginVertical: Spacing.three },
  field: { marginTop: Spacing.three },
  label: { color: '#14253B', marginBottom: Spacing.one },
  input: { backgroundColor: '#FFF', borderColor: '#D6DDEA', borderRadius: 12, borderWidth: 1, color: '#14253B', minHeight: 48, paddingHorizontal: Spacing.three },
  error: { color: '#B42318', marginTop: Spacing.three },
  submit: { alignItems: 'center', backgroundColor: '#E7194F', borderRadius: 12, justifyContent: 'center', marginTop: Spacing.four, minHeight: 50 },
  submitText: { color: '#FFF' },
  link: { color: '#0878A8', marginTop: Spacing.three, textAlign: 'center' },
});

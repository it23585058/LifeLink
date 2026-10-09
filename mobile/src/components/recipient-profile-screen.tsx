import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { donorSession } from '@/lib/donor-session';
import { roleAuthApi, type Recipient } from '@/lib/role-auth-api';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function RecipientProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Recipient | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const role = await donorSession.getRole();
      if (role !== 'recipient') {
        setError('This session cannot access a recipient profile.');
        return;
      }
      const result = await roleAuthApi.getRecipientProfile();
      setProfile(result);
      setName(result.name);
      setPhone(result.phone);
      setCity(result.city);
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'Could not load your recipient profile.' : 'Could not load your recipient profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!name.trim() || !phone.trim() || !city.trim()) {
      setError('Name, contact number and city are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await roleAuthApi.updateRecipientProfile({ name: name.trim(), phone: phone.trim(), city: city.trim() });
      setProfile(result);
      setEditing(false);
      setSuccess('Profile updated successfully.');
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.error || 'Could not save your profile.' : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await donorSession.clear();
    router.replace('/role-select');
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()}><ThemedText style={styles.back}>‹ Back</ThemedText></Pressable>
          <ThemedText type="subtitle" style={styles.title}>Recipient Profile</ThemedText>
          {loading ? <ActivityIndicator color="#E7194F" style={styles.loader} /> : profile ? <>
            <ThemedText style={styles.accountId}>Account ID: {profile._id}</ThemedText>
            <Field label="Full name" value={name} onChangeText={setName} editable={editing} />
            <Field label="Email" value={profile.email} onChangeText={() => undefined} editable={false} />
            <Field label="Contact number" value={phone} onChangeText={setPhone} editable={editing} keyboardType="phone-pad" />
            <Field label="City" value={city} onChangeText={setCity} editable={editing} />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
            {success && <ThemedText style={styles.success}>{success}</ThemedText>}
            {editing ? <Pressable onPress={() => void save()} disabled={saving} style={styles.primary}>{saving ? <ActivityIndicator color="#FFF" /> : <ThemedText type="smallBold" style={styles.primaryText}>Save changes</ThemedText>}</Pressable> : <Pressable onPress={() => { setSuccess(null); setError(null); setEditing(true); }} style={styles.primary}><ThemedText type="smallBold" style={styles.primaryText}>Edit profile</ThemedText></Pressable>}
          </> : <>
            <ThemedText style={styles.error}>{error || 'Recipient profile is unavailable.'}</ThemedText>
            <Pressable onPress={() => void load()} style={styles.primary}><ThemedText type="smallBold" style={styles.primaryText}>Try again</ThemedText></Pressable>
          </>}
          <Pressable onPress={() => void logout()}><ThemedText style={styles.logout}>Log out</ThemedText></Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, value, onChangeText, editable, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; editable: boolean; keyboardType?: 'default' | 'phone-pad' }) {
  return <View style={styles.field}><ThemedText type="smallBold" style={styles.label}>{label}</ThemedText><TextInput value={value} onChangeText={onChangeText} editable={editable} keyboardType={keyboardType} style={[styles.input, !editable && styles.readOnly]} /></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F8FF', flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 48 },
  back: { color: '#E7194F', marginBottom: Spacing.four },
  title: { color: '#14253B', fontSize: 28 },
  accountId: { color: '#6E7180', fontSize: 12, marginTop: Spacing.two },
  loader: { marginTop: Spacing.five },
  field: { marginTop: Spacing.three },
  label: { color: '#14253B', marginBottom: Spacing.one },
  input: { backgroundColor: '#FFF', borderColor: '#D6DDEA', borderRadius: 12, borderWidth: 1, color: '#14253B', minHeight: 48, paddingHorizontal: Spacing.three },
  readOnly: { backgroundColor: '#EEF0F5', color: '#6E7180' },
  error: { color: '#B42318', marginTop: Spacing.three },
  success: { color: '#087A3E', marginTop: Spacing.three },
  primary: { alignItems: 'center', backgroundColor: '#E7194F', borderRadius: 12, justifyContent: 'center', marginTop: Spacing.four, minHeight: 50, padding: Spacing.three },
  primaryText: { color: '#FFF' },
  logout: { color: '#B42318', marginTop: Spacing.five, textAlign: 'center' },
});

import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { bloodRequestApi } from '@/lib/api';
import { donorSession } from '@/lib/donor-session';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['routine', 'urgent', 'critical'] as const;

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === 'string') return responseError;
    return `Request failed with status ${error.response?.status ?? 'unknown'}.`;
  }

  return error instanceof Error ? error.message : 'Could not create the request.';
}

export function RequestCreationScreen() {
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospital, setHospital] = useState('');
  const [city, setCity] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [urgency, setUrgency] = useState<(typeof URGENCY_LEVELS)[number]>('urgent');
  const [notes, setNotes] = useState('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    donorSession.get()
      .then((id) => {
        if (!cancelled) setRequesterId(id);
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('Your donor session could not be loaded. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createRequest = async () => {
    setMessage(null);
    setErrorMessage(null);

    const parsedUnits = Number(unitsNeeded);
    if (!requesterId) {
      setErrorMessage('Sign in again before creating a blood request.');
      return;
    }
    if (!patientName.trim() || !bloodGroup || !hospital.trim() || !city.trim() || !contactNumber.trim()) {
      setErrorMessage('Complete all required fields.');
      return;
    }
    if (!Number.isInteger(parsedUnits) || parsedUnits < 1) {
      setErrorMessage('Required units must be a whole number greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await bloodRequestApi.create({
        requesterId,
        patientName: patientName.trim(),
        bloodGroup,
        hospital: hospital.trim(),
        city: city.trim(),
        unitsNeeded: parsedUnits,
        urgency,
        notes: notes.trim() || undefined,
        contactNumber: contactNumber.trim(),
      });
      setPatientName('');
      setBloodGroup('');
      setHospital('');
      setCity('');
      setUnitsNeeded('');
      setContactNumber('');
      setNotes('');
      setUrgency('urgent');
      setMessage('Blood request created successfully.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={styles.submitText.color} />
        <ThemedText style={styles.muted}>Loading your donor session...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>Create Blood Request</ThemedText>
          <ThemedText style={styles.muted}>Available donors will see this request in the Emergency Feed.</ThemedText>

          <Field label="Patient name" value={patientName} onChangeText={setPatientName} />
          <ThemedText type="smallBold" style={styles.label}>Blood group</ThemedText>
          <View style={styles.choiceRow}>
            {BLOOD_GROUPS.map((group) => (
              <Choice key={group} label={group} selected={bloodGroup === group} onPress={() => setBloodGroup(group)} />
            ))}
          </View>
          <Field label="Hospital" value={hospital} onChangeText={setHospital} />
          <Field label="City / location" value={city} onChangeText={setCity} />
          <Field label="Required units" value={unitsNeeded} onChangeText={setUnitsNeeded} keyboardType="numeric" />
          <Field label="Contact number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
          <ThemedText type="smallBold" style={styles.label}>Urgency</ThemedText>
          <View style={styles.choiceRow}>
            {URGENCY_LEVELS.map((level) => (
              <Choice key={level} label={level.toUpperCase()} selected={urgency === level} onPress={() => setUrgency(level)} />
            ))}
          </View>
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />

          {errorMessage && <ThemedText style={styles.error}>{errorMessage}</ThemedText>}
          {message && <ThemedText style={styles.success}>{message}</ThemedText>}
          <Pressable disabled={isSubmitting} onPress={() => void createRequest()} style={[styles.submit, isSubmitting && styles.disabled]}>
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="smallBold" style={styles.submitText}>Create request</ThemedText>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, multiline, ...props }: { label: string; multiline?: boolean; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'numeric' | 'phone-pad' }) {
  return (
    <>
      <ThemedText type="smallBold" style={styles.label}>{label}</ThemedText>
      <TextInput {...props} multiline={multiline} placeholder={label} placeholderTextColor="#8A8F9C" style={[styles.input, multiline && styles.multiline]} />
    </>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <ThemedText type="smallBold" style={selected ? styles.choiceTextSelected : styles.choiceText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FF' },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: 140 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: Spacing.two, backgroundColor: '#F7F8FF' },
  title: { color: '#14253B', fontSize: 28, marginBottom: Spacing.one },
  muted: { color: '#6E7180', lineHeight: 22 },
  label: { color: '#14253B', marginTop: Spacing.three, marginBottom: Spacing.one },
  input: { backgroundColor: '#FFFFFF', borderColor: '#D6DDEA', borderRadius: 12, borderWidth: 1, color: '#14253B', minHeight: 48, paddingHorizontal: Spacing.three },
  multiline: { minHeight: 88, paddingTop: Spacing.two, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: { backgroundColor: '#FFFFFF', borderColor: '#D6DDEA', borderRadius: 10, borderWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  choiceSelected: { backgroundColor: '#FFE7EE', borderColor: '#E7194F' },
  choiceText: { color: '#14253B' },
  choiceTextSelected: { color: '#C9003D' },
  error: { color: '#B42318', marginTop: Spacing.three },
  success: { color: '#087A3E', marginTop: Spacing.three },
  submit: { alignItems: 'center', backgroundColor: '#E7194F', borderRadius: 12, marginTop: Spacing.four, minHeight: 50, justifyContent: 'center' },
  disabled: { opacity: 0.65 },
  submitText: { color: '#FFFFFF' },
});

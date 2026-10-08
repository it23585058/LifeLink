import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { donorManagementApi } from '@/lib/donor-api';

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
  blue: '#0878A8',
  blueSoft: '#E6F4FF',
  green: '#087A3E',
  greenSoft: '#D9F8E7',
  errorText: '#B42318',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const UNKNOWN_BLOOD = 'UNKNOWN';
const RADIUS_OPTIONS = [5, 10, 15, 25];

const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/;

type FormErrors = {
  name?: string;
  nic?: string;
  phone?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
  bloodGroup?: string;
  eligibility?: string;
};

// 0771234567 or +94771234567 -> +94771234567
function normalizePhone(value: string) {
  const compact = value.replace(/[\s-]/g, '');
  return compact.startsWith('0') ? `+94${compact.slice(1)}` : compact;
}

export function DonorRegistrationScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [ageWeightOk, setAgeWeightOk] = useState(false);
  const [donationIntervalOk, setDonationIntervalOk] = useState(false);
  const [medicalSafetyOk, setMedicalSafetyOk] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [travelRadiusKm, setTravelRadiusKm] = useState(5);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const allEligible = ageWeightOk && donationIntervalOk && medicalSafetyOk;

  const validate = () => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = 'Enter your full legal name.';
    if (!NIC_PATTERN.test(nic.trim())) next.nic = 'Use 9 digits + V/X, or 12 digits.';
    if (!PHONE_PATTERN.test(phone.replace(/[\s-]/g, ''))) next.phone = 'Use a Sri Lankan mobile number, e.g. 077 123 4567.';
    if (city.trim().length < 2) next.city = 'Enter your city.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    if (!bloodGroup) next.bloodGroup = 'Pick a blood group, or choose "I don\'t know my blood type".';
    if (!allEligible) next.eligibility = 'You need to confirm all three checks to register as a donor.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setName('');
    setNic('');
    setPhone('');
    setCity('');
    setPassword('');
    setConfirmPassword('');
    setBloodGroup(null);
    setAgeWeightOk(false);
    setDonationIntervalOk(false);
    setMedicalSafetyOk(false);
    setEmergencyAlerts(true);
    setTravelRadiusKm(5);
    setErrors({});
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSuccessId(null);
    if (!validate() || !bloodGroup) return;

    setIsSubmitting(true);
    try {
      const donor = await donorManagementApi.create({
        name: name.trim(),
        nic: nic.trim().toUpperCase(),
        phone: normalizePhone(phone),
        city: city.trim(),
        password,
        bloodGroup,
        available: emergencyAlerts,
        eligibility: { ageWeightOk, donationIntervalOk, medicalSafetyOk },
        emergencyAlerts,
        travelRadiusKm,
      });
      resetForm();
      router.replace({ pathname: '/donor-home', params: { donorId: donor._id } });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.error as string | undefined;
        if (serverMessage?.includes('E11000') || error.response?.status === 409) {
          setSubmitError('This NIC is already registered.');
        } else if (serverMessage) {
          setSubmitError(serverMessage);
        } else if (!error.response) {
          setSubmitError('Could not reach the server. Check your connection and try again.');
        } else {
          setSubmitError('Registration failed. Please check your details and try again.');
        }
      } else {
        setSubmitError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.headerRow}>
              <Pressable accessibilityLabel="Back" onPress={() => router.replace('/role-select')} style={styles.backButton}>
                <ThemedText style={styles.backText}>‹</ThemedText>
              </Pressable>
              <View style={styles.headerTitleBlock}>
                <ThemedText type="subtitle" style={styles.heading}>Donor Registration</ThemedText>
                <ThemedText type="small" style={styles.headerSub}>LifeLink Official Network</ThemedText>
              </View>
            </View>

            <View style={styles.introCard}>
              <ThemedText type="smallBold" style={styles.introTitle}>Join the LifeLink verified donor network</ThemedText>
              <ThemedText type="small" style={styles.introText}>
                Your details help hospitals reach the right donor quickly when a patient needs blood in your area.
              </ThemedText>
            </View>

            {successId && (
              <View style={styles.successBox}>
                <ThemedText type="smallBold" style={styles.successTitle}>Registered successfully</ThemedText>
                <ThemedText type="small" style={styles.successText}>
                  You are now part of the donor network. Donor ID: {successId}
                </ThemedText>
              </View>
            )}

            {/* Personal details */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>Personal details</ThemedText>

              <Field label="Full legal name" error={errors.name}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priyantha Bandara"
                  placeholderTextColor="#9AA3B5"
                  style={[styles.input, errors.name && styles.inputError]}
                  accessibilityLabel="Full legal name"
                />
              </Field>

              <Field label="National ID / NIC number" error={errors.nic}>
                <TextInput
                  value={nic}
                  onChangeText={setNic}
                  placeholder="e.g. 199912345678 or 991234567V"
                  placeholderTextColor="#9AA3B5"
                  autoCapitalize="characters"
                  style={[styles.input, errors.nic && styles.inputError]}
                  accessibilityLabel="NIC number"
                />
              </Field>

              <Field label="Mobile phone number" error={errors.phone}>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+94 77 123 4567"
                  placeholderTextColor="#9AA3B5"
                  keyboardType="phone-pad"
                  style={[styles.input, errors.phone && styles.inputError]}
                  accessibilityLabel="Mobile phone number"
                />
              </Field>
              <ThemedText type="small" style={styles.privacyNote}>
                Your phone number is only shared with verified hospitals when a request matches you.
              </ThemedText>

              <Field label="City" error={errors.city}>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Galle"
                  placeholderTextColor="#9AA3B5"
                  style={[styles.input, errors.city && styles.inputError]}
                  accessibilityLabel="City"
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9AA3B5"
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, errors.password && styles.inputError]}
                  accessibilityLabel="Password"
                />
              </Field>

              <Field label="Confirm password" error={errors.confirmPassword}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor="#9AA3B5"
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  accessibilityLabel="Confirm password"
                />
              </Field>
            </View>

            {/* Blood group */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>Blood group</ThemedText>
              <ThemedText type="small" style={styles.helper}>
                Choose your confirmed ABO/Rh group. If you are not sure, pick the last option.
              </ThemedText>

              <View style={styles.bloodGrid}>
                {BLOOD_GROUPS.map((group) => {
                  const selected = bloodGroup === group;
                  return (
                    <Pressable
                      key={group}
                      onPress={() => setBloodGroup(group)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.bloodButton, selected && styles.bloodButtonSelected]}>
                      <ThemedText style={[styles.bloodButtonText, selected && styles.bloodButtonTextSelected]}>
                        {group}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => setBloodGroup(UNKNOWN_BLOOD)}
                accessibilityRole="button"
                accessibilityState={{ selected: bloodGroup === UNKNOWN_BLOOD }}
                style={[styles.unknownButton, bloodGroup === UNKNOWN_BLOOD && styles.unknownButtonSelected]}>
                <ThemedText type="smallBold" style={styles.unknownTitle}>I don&apos;t know my blood type</ThemedText>
                <ThemedText type="small" style={styles.helper}>
                  You can still register. A hospital can confirm your blood group with a screening test.
                </ThemedText>
              </Pressable>
              {errors.bloodGroup && <ThemedText type="small" style={styles.errorText}>{errors.bloodGroup}</ThemedText>}
            </View>

            {/* Eligibility */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>Eligibility self-check</ThemedText>
              <ThemedText type="small" style={styles.helper}>
                Confirm all three conditions before joining the emergency donor list.
              </ThemedText>

              <CheckRow
                checked={ageWeightOk}
                onToggle={() => setAgeWeightOk((value) => !value)}
                title="Age and weight standards"
                body="I am between 18 and 60 years old and weigh at least 50 kg."
              />
              <CheckRow
                checked={donationIntervalOk}
                onToggle={() => setDonationIntervalOk((value) => !value)}
                title="Donation interval"
                body="At least 90 days have passed since my last whole blood donation (or I have never donated)."
              />
              <CheckRow
                checked={medicalSafetyOk}
                onToggle={() => setMedicalSafetyOk((value) => !value)}
                title="Medical and procedural safety"
                body="I have not had major surgery, body piercings, tattoos, or unmanaged illness in the last 6 months."
              />
              {errors.eligibility && <ThemedText type="small" style={styles.errorText}>{errors.eligibility}</ThemedText>}
            </View>

            {/* Availability */}
            <View style={styles.section}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>Availability</ThemedText>

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold" style={styles.ink}>Emergency alerts</ThemedText>
                  <ThemedText type="small" style={styles.helper}>
                    Get notified when a critical request matches your blood group nearby.
                  </ThemedText>
                </View>
                <Switch
                  value={emergencyAlerts}
                  onValueChange={setEmergencyAlerts}
                  trackColor={{ false: '#C9CED8', true: palette.red }}
                  accessibilityLabel="Emergency alerts"
                />
              </View>

              <ThemedText type="smallBold" style={[styles.ink, styles.radiusLabel]}>Travel radius</ThemedText>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((km) => {
                  const selected = travelRadiusKm === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => setTravelRadiusKm(km)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.radiusButton, selected && styles.radiusButtonSelected]}>
                      <ThemedText type="small" style={[styles.radiusText, selected && styles.radiusTextSelected]}>
                        {km} km
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <ThemedText type="small" style={styles.helper}>
                You will only be alerted for requests within this distance.
              </ThemedText>
            </View>

            {submitError && (
              <View style={styles.errorBox}>
                <ThemedText type="small" style={styles.errorBoxText}>{submitError}</ThemedText>
              </View>
            )}

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
              accessibilityRole="button"
              style={[styles.submitButton, (isSubmitting || !allEligible) && styles.submitButtonDim]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitText}>Register as donor</ThemedText>
              )}
            </Pressable>
            {!allEligible && (
              <ThemedText type="small" style={styles.submitHint}>
                Confirm all three eligibility checks to register.
              </ThemedText>
            )}

            <Pressable onPress={() => router.push('/donor-login' as never)} style={styles.loginLink}>
              <ThemedText type="small" style={styles.loginLinkText}>
                Already registered? <ThemedText type="smallBold" style={styles.loginLinkBold}>Log in</ThemedText>
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" style={styles.ink}>{label}</ThemedText>
      {children}
      {error && <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
}

function CheckRow({
  checked,
  onToggle,
  title,
  body,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  body: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.checkRow, checked && styles.checkRowChecked]}>
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked && <ThemedText style={styles.checkMark}>✓</ThemedText>}
      </View>
      <View style={styles.checkCopy}>
        <ThemedText type="smallBold" style={styles.ink}>{title}</ThemedText>
        <ThemedText type="small" style={styles.helper}>{body}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.canvas, flex: 1 },
  safeArea: { flex: 1 },
  content: { gap: Spacing.three, paddingHorizontal: Spacing.three, paddingBottom: 110, paddingTop: Platform.OS === 'web' ? 96 : Spacing.two },

  headerRow: { alignItems: 'center', flexDirection: 'row' },
  backButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 34 },
  backText: { color: palette.ink, fontSize: 30, lineHeight: 32 },
  headerTitleBlock: { flex: 1, marginLeft: Spacing.one },
  heading: { color: palette.red, fontSize: 22, lineHeight: 27 },
  headerSub: { color: palette.blue, fontSize: 12, fontWeight: '600' },

  introCard: { backgroundColor: palette.blueSoft, borderColor: '#A8D9FF', borderRadius: 9, borderWidth: 1, gap: 4, padding: Spacing.three },
  introTitle: { color: palette.blue, fontSize: 15 },
  introText: { color: palette.blue, fontSize: 12, lineHeight: 17 },

  successBox: { backgroundColor: palette.greenSoft, borderColor: '#9AD9B6', borderRadius: 9, borderWidth: 1, gap: 4, padding: Spacing.three },
  successTitle: { color: palette.green },
  successText: { color: palette.green, fontSize: 12, lineHeight: 17 },

  section: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 12, borderWidth: 1, gap: Spacing.two, padding: Spacing.three },
  sectionTitle: { color: palette.ink, fontSize: 16 },
  helper: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  ink: { color: palette.ink },

  field: { gap: 6 },
  input: { backgroundColor: palette.surface, borderColor: '#CAD4E6', borderRadius: 9, borderWidth: 1, color: palette.ink, fontSize: 14, minHeight: 46, paddingHorizontal: Spacing.two },
  inputError: { borderColor: palette.errorText },
  errorText: { color: palette.errorText, fontSize: 12 },
  privacyNote: { backgroundColor: palette.blueSoft, borderRadius: 6, color: palette.blue, fontSize: 12, lineHeight: 17, padding: Spacing.two },

  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bloodButton: { alignItems: 'center', backgroundColor: palette.surface, borderColor: '#CAD4E6', borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 48, width: '23%' },
  bloodButtonSelected: { backgroundColor: palette.red, borderColor: palette.red },
  bloodButtonText: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  bloodButtonTextSelected: { color: '#FFFFFF' },
  unknownButton: { backgroundColor: '#F7F9FD', borderColor: '#CAD4E6', borderRadius: 9, borderStyle: 'dashed', borderWidth: 1.5, gap: 4, padding: Spacing.three },
  unknownButtonSelected: { backgroundColor: palette.redSoft, borderColor: palette.red },
  unknownTitle: { color: palette.ink },

  checkRow: { alignItems: 'flex-start', backgroundColor: '#F7F9FD', borderColor: palette.border, borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: Spacing.two, padding: Spacing.two },
  checkRowChecked: { backgroundColor: palette.greenSoft, borderColor: '#9AD9B6' },
  checkBox: { alignItems: 'center', backgroundColor: palette.surface, borderColor: '#9AA3B5', borderRadius: 5, borderWidth: 1.5, height: 22, justifyContent: 'center', marginTop: 2, width: 22 },
  checkBoxChecked: { backgroundColor: palette.green, borderColor: palette.green },
  checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  checkCopy: { flex: 1, gap: 2 },

  switchRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  switchCopy: { flex: 1, gap: 2 },
  radiusLabel: { marginTop: Spacing.one },
  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  radiusButton: { backgroundColor: palette.surface, borderColor: '#CAD4E6', borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  radiusButtonSelected: { backgroundColor: palette.redSoft, borderColor: palette.red },
  radiusText: { color: palette.ink, fontWeight: '600' },
  radiusTextSelected: { color: palette.red },

  errorBox: { backgroundColor: '#FEE4E2', borderColor: '#FDA29B', borderRadius: 9, borderWidth: 1, padding: Spacing.three },
  errorBoxText: { color: palette.errorText },

  submitButton: { alignItems: 'center', backgroundColor: palette.red, borderRadius: 12, justifyContent: 'center', minHeight: 52 },
  submitButtonDim: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16 },
  submitHint: { color: palette.muted, fontSize: 12, textAlign: 'center' },

  loginLink: { alignItems: 'center', paddingVertical: Spacing.two },
  loginLinkText: { color: palette.muted, fontSize: 13 },
  loginLinkBold: { color: palette.red, fontSize: 13 },
});

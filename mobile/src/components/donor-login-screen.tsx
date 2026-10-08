import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

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
  blue: '#0878A8',
  blueSoft: '#E6F4FF',
  errorText: '#B42318',
};

const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;

type FormErrors = {
  nic?: string;
  password?: string;
};

export function DonorLoginScreen() {
  const router = useRouter();

  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const next: FormErrors = {};

    if (!NIC_PATTERN.test(nic.trim())) {
      next.nic = 'Use 9 digits + V/X, or 12 digits.';
    }

    if (password.length === 0) {
      next.password = 'Enter your password.';
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { token, donor } = await donorManagementApi.login(
        nic.trim().toUpperCase(),
        password
      );

      // Token can be stored here if your project uses AsyncStorage
      // or another authentication storage solution.
      console.log('Login successful. Token:', token);

      router.replace({
        pathname: '/donor-home',
        params: {
          donorId: donor._id,
        },
      });
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        setSubmitError('Incorrect NIC or password.');
      } else if (
        axios.isAxiosError(error) &&
        !error.response
      ) {
        setSubmitError(
          'Could not reach the server. Check your connection and try again.'
        );
      } else {
        setSubmitError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <Pressable
                accessibilityLabel="Back"
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ThemedText style={styles.backText}>‹</ThemedText>
              </Pressable>

              <View style={styles.headerTitleBlock}>
                <ThemedText
                  type="subtitle"
                  style={styles.heading}
                >
                  Donor Login
                </ThemedText>

                <ThemedText
                  type="small"
                  style={styles.headerSub}
                >
                  LifeLink Official Network
                </ThemedText>
              </View>
            </View>

            <View style={styles.introCard}>
              <ThemedText
                type="smallBold"
                style={styles.introTitle}
              >
                Welcome back
              </ThemedText>

              <ThemedText
                type="small"
                style={styles.introText}
              >
                Log in with the NIC number and password you used
                when registering.
              </ThemedText>
            </View>

            <View style={styles.section}>
              <View style={styles.field}>
                <ThemedText
                  type="smallBold"
                  style={styles.ink}
                >
                  National ID / NIC number
                </ThemedText>

                <TextInput
                  value={nic}
                  onChangeText={setNic}
                  placeholder="e.g. 199912345678 or 991234567V"
                  placeholderTextColor="#9AA3B5"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    errors.nic && styles.inputError,
                  ]}
                  accessibilityLabel="NIC number"
                />

                {errors.nic && (
                  <ThemedText
                    type="small"
                    style={styles.errorText}
                  >
                    {errors.nic}
                  </ThemedText>
                )}
              </View>

              <View style={styles.field}>
                <ThemedText
                  type="smallBold"
                  style={styles.ink}
                >
                  Password
                </ThemedText>

                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9AA3B5"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
                    accessibilityLabel="Password"
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword((value) => !value)
                    }
                    style={styles.showButton}
                    accessibilityRole="button"
                  >
                    <ThemedText
                      type="smallBold"
                      style={styles.showText}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </ThemedText>
                  </Pressable>
                </View>

                {errors.password && (
                  <ThemedText
                    type="small"
                    style={styles.errorText}
                  >
                    {errors.password}
                  </ThemedText>
                )}
              </View>
            </View>

            {submitError && (
              <View style={styles.errorBox}>
                <ThemedText
                  type="small"
                  style={styles.errorBoxText}
                >
                  {submitError}
                </ThemedText>
              </View>
            )}

            <Pressable
              onPress={() => void handleLogin()}
              disabled={isSubmitting}
              accessibilityRole="button"
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDim,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText
                  type="smallBold"
                  style={styles.submitText}
                >
                  Log in
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace('/donor-register')}
              style={styles.registerLink}
            >
              <ThemedText
                type="small"
                style={styles.registerLinkText}
              >
                New donor?{' '}
                <ThemedText
                  type="smallBold"
                  style={styles.registerLinkBold}
                >
                  Register
                </ThemedText>
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.canvas,
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: 110,
    paddingTop:
      Platform.OS === 'web' ? 96 : Spacing.two,
  },

  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  backButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 34,
  },

  backText: {
    color: palette.ink,
    fontSize: 30,
    lineHeight: 32,
  },

  headerTitleBlock: {
    flex: 1,
    marginLeft: Spacing.one,
  },

  heading: {
    color: palette.red,
    fontSize: 22,
    lineHeight: 27,
  },

  headerSub: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '600',
  },

  introCard: {
    backgroundColor: palette.blueSoft,
    borderColor: '#A8D9FF',
    borderRadius: 9,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.three,
  },

  introTitle: {
    color: palette.blue,
    fontSize: 15,
  },

  introText: {
    color: palette.blue,
    fontSize: 12,
    lineHeight: 17,
  },

  section: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },

  ink: {
    color: palette.ink,
  },

  field: {
    gap: 6,
  },

  input: {
    backgroundColor: palette.surface,
    borderColor: '#CAD4E6',
    borderRadius: 9,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: Spacing.two,
  },

  inputError: {
    borderColor: palette.errorText,
  },

  errorText: {
    color: palette.errorText,
    fontSize: 12,
  },

  passwordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },

  passwordInput: {
    flex: 1,
  },

  showButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },

  showText: {
    color: palette.blue,
  },

  errorBox: {
    backgroundColor: '#FEE4E2',
    borderColor: '#FDA29B',
    borderRadius: 9,
    borderWidth: 1,
    padding: Spacing.three,
  },

  errorBoxText: {
    color: palette.errorText,
  },

  submitButton: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
  },

  submitButtonDim: {
    opacity: 0.6,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  registerLink: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },

  registerLinkText: {
    color: palette.muted,
    fontSize: 13,
  },

  registerLinkBold: {
    color: palette.red,
    fontSize: 13,
  },
});
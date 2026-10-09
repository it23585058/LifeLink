import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import {
  donorManagementApi,
  type DonorProfile,
} from '@/lib/donor-api';
import { donorSession } from '@/lib/donor-session';

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
  green: '#087A3E',
  greenSoft: '#E7F7EF',
  yellow: '#9A6700',
  yellowSoft: '#FFF3E0',
};

export function DonorProfileScreen() {
  const router = useRouter();

  const { donorId: paramDonorId } =
    useLocalSearchParams<{
      donorId?: string;
    }>();

  const [donor, setDonor] =
    useState<DonorProfile | null>(null);

  const [donorId, setDonorId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [reloadKey, setReloadKey] =
    useState(0);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [action, setAction] =
    useState<'delete' | 'logout' | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [missingAccount, setMissingAccount] =
    useState(false);

  // Personal information
  const [editName, setEditName] =
    useState('');

  const [editPhone, setEditPhone] =
    useState('');

  const [editCity, setEditCity] =
    useState('');

  // Donor credentials
  const [editAge, setEditAge] =
    useState('');

  const [editWeight, setEditWeight] =
    useState('');

  const [editHeight, setEditHeight] =
    useState('');

  const [editLastDonation, setEditLastDonation] =
    useState('');

  // Emergency alerts
  const [emergencyAlerts, setEmergencyAlerts] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDonor = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const storedDonorId =
          await donorSession.get();

        const role = await donorSession.getRole();
        const activeId = storedDonorId;

        if (role && role !== 'donor') {
          if (!cancelled) {
            setErrorMessage('This is not a donor session. Please sign in as a donor.');
            setMissingAccount(true);
            setIsLoading(false);
          }
          return;
        }

        if (!activeId) {
          if (!cancelled) {
            setErrorMessage(
              'No donor account found.'
            );
            setIsLoading(false);
          }

          return;
        }

        if (!cancelled) {
          setDonorId(activeId);
        }

        const data =
          await donorManagementApi.get(activeId);

        if (!cancelled) {
          setDonor(data);

          setEditName(data.name ?? '');
          setEditPhone(data.phone ?? '');
          setEditCity(data.city ?? '');

          setEditAge(
            data.age !== undefined
              ? String(data.age)
              : ''
          );

          setEditWeight(
            data.weightKg !== undefined
              ? String(data.weightKg)
              : ''
          );

          setEditHeight(
            data.heightCm !== undefined
              ? String(data.heightCm)
              : ''
          );

          setEditLastDonation(
            data.lastDonationAt
              ? data.lastDonationAt.substring(
                  0,
                  10
                )
              : ''
          );

          setEmergencyAlerts(
            data.emergencyAlerts !== false
          );
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            setErrorMessage('This donor account is no longer available. Please sign in again.');
            setMissingAccount(true);
          } else if (axios.isAxiosError(error) && error.response?.status === 403) {
            setErrorMessage('This session cannot access a donor profile. Please sign in again.');
            setMissingAccount(true);
          } else {
            setErrorMessage('Could not load your profile. Check your connection.');
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDonor();

    return () => {
      cancelled = true;
    };
  }, [paramDonorId, reloadKey]);

  const goBack = () => {
    router.back();
  };

  const startEditing = () => {
    if (!donor) {
      return;
    }

    setEditName(donor.name ?? '');
    setEditPhone(donor.phone ?? '');
    setEditCity(donor.city ?? '');

    setEditAge(
      donor.age !== undefined
        ? String(donor.age)
        : ''
    );

    setEditWeight(
      donor.weightKg !== undefined
        ? String(donor.weightKg)
        : ''
    );

    setEditHeight(
      donor.heightCm !== undefined
        ? String(donor.heightCm)
        : ''
    );

    setEditLastDonation(
      donor.lastDonationAt
        ? donor.lastDonationAt.substring(
            0,
            10
          )
        : ''
    );

    setEmergencyAlerts(
      donor.emergencyAlerts !== false
    );

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (donor) {
      setEditName(donor.name ?? '');
      setEditPhone(donor.phone ?? '');
      setEditCity(donor.city ?? '');

      setEditAge(
        donor.age !== undefined
          ? String(donor.age)
          : ''
      );

      setEditWeight(
        donor.weightKg !== undefined
          ? String(donor.weightKg)
          : ''
      );

      setEditHeight(
        donor.heightCm !== undefined
          ? String(donor.heightCm)
          : ''
      );

      setEditLastDonation(
        donor.lastDonationAt
          ? donor.lastDonationAt.substring(
              0,
              10
            )
          : ''
      );

      setEmergencyAlerts(
        donor.emergencyAlerts !== false
      );
    }

    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleEmergencyAlertsChange = async (
    value: boolean
  ) => {
    if (!donorId || !donor) {
      return;
    }

    const oldValue = emergencyAlerts;

    try {
      setEmergencyAlerts(value);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updated =
        await donorManagementApi.update(
          donorId,
          {
            emergencyAlerts: value,
          }
        );

      setDonor(updated);

      setSuccessMessage(
        value
          ? 'Emergency alerts enabled.'
          : 'Emergency alerts disabled.'
      );
    } catch (error) {
      console.error(
        'EMERGENCY ALERT UPDATE ERROR:',
        error
      );

      setEmergencyAlerts(oldValue);

      setErrorMessage(
        'Could not update emergency alerts.'
      );
    }
  };

  const handleUpdate = async () => {
    if (!donorId) {
      setErrorMessage(
        'Donor account could not be identified.'
      );
      return;
    }

    if (!editName.trim()) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!editPhone.trim()) {
      setErrorMessage(
        'Phone number is required.'
      );
      return;
    }

    if (!editCity.trim()) {
      setErrorMessage('City is required.');
      return;
    }

    const age = Number(editAge);
    const weightKg = Number(editWeight);
    const heightCm = Number(editHeight);

    if (
      !editAge.trim() ||
      !Number.isFinite(age) ||
      age < 18 ||
      age > 100
    ) {
      setErrorMessage(
        'Age must be between 18 and 100.'
      );
      return;
    }

    if (
      !editWeight.trim() ||
      !Number.isFinite(weightKg) ||
      weightKg < 30 ||
      weightKg > 300
    ) {
      setErrorMessage(
        'Weight must be between 30 and 300 kg.'
      );
      return;
    }

    if (
      !editHeight.trim() ||
      !Number.isFinite(heightCm) ||
      heightCm < 100 ||
      heightCm > 250
    ) {
      setErrorMessage(
        'Height must be between 100 and 250 cm.'
      );
      return;
    }

    let lastDonationAt:
      | string
      | undefined;

    if (editLastDonation.trim()) {
      const parsedDate = new Date(
        `${editLastDonation.trim()}T00:00:00`
      );

      if (Number.isNaN(parsedDate.getTime())) {
        setErrorMessage(
          'Last donation date is invalid. Use YYYY-MM-DD.'
        );
        return;
      }

      if (parsedDate > new Date()) {
        setErrorMessage(
          'Last donation date cannot be in the future.'
        );
        return;
      }

      lastDonationAt =
        parsedDate.toISOString();
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updated =
        await donorManagementApi.update(
          donorId,
          {
            name: editName.trim(),
            phone: editPhone.trim(),
            city: editCity.trim(),
            age,
            weightKg,
            heightCm,
            lastDonationAt,
            emergencyAlerts,
          }
        );

      setDonor(updated);

      setEditName(updated.name ?? '');
      setEditPhone(updated.phone ?? '');
      setEditCity(updated.city ?? '');

      setEditAge(
        updated.age !== undefined
          ? String(updated.age)
          : ''
      );

      setEditWeight(
        updated.weightKg !== undefined
          ? String(updated.weightKg)
          : ''
      );

      setEditHeight(
        updated.heightCm !== undefined
          ? String(updated.heightCm)
          : ''
      );

      setEditLastDonation(
        updated.lastDonationAt
          ? updated.lastDonationAt.substring(
              0,
              10
            )
          : ''
      );

      setEmergencyAlerts(
        updated.emergencyAlerts !== false
      );

      setIsEditing(false);

      setSuccessMessage(
        'Profile updated successfully.'
      );
    } catch (error) {
      console.error(
        'UPDATE DONOR ERROR:',
        error
      );

      setErrorMessage(
        'Could not update your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const askDelete = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAction('delete');
  };

  const askLogout = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAction('logout');
  };

  const cancelAction = () => {
    setAction(null);
  };

  const confirmDelete = async () => {
    if (!donorId) {
      setErrorMessage(
        'Donor account could not be identified.'
      );
      setAction(null);
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage(null);

      await donorManagementApi.remove(
        donorId
      );

      await donorSession.clear();

      setAction(null);

      router.replace('/role-select');
    } catch (error) {
      console.error(
        'DELETE DONOR ERROR:',
        error
      );

      setErrorMessage(
        'Could not delete your account. Please try again.'
      );

      setAction(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmLogout = async () => {
    try {
      await donorSession.clear();

      setAction(null);

      router.replace('/role-select');
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      );

      setErrorMessage(
        'Could not logout. Please try again.'
      );

      setAction(null);
    }
  };

  const nextEligibleDonation =
    donor?.lastDonationAt
      ? calculateNextDonationDate(
          donor.lastDonationAt
        )
      : null;

  if (isLoading && !donor) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={palette.red}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!donor) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}
        >
          <View style={styles.content}>
            <Header onBack={goBack} />

            <View style={styles.noticeBox}>
              <ThemedText
                type="small"
                style={styles.noticeText}
              >
                {errorMessage ??
                  'Could not load your profile.'}
              </ThemedText>
            </View>

            {!missingAccount && <Pressable
              onPress={() => setReloadKey((value) => value + 1)}
              style={styles.updateButton}
            >
              <ThemedText type="smallBold" style={styles.buttonText}>Try Again</ThemedText>
            </Pressable>}

            <Pressable
              onPress={async () => {
                await donorSession.clear();
                router.replace('/role-select');
              }}
              style={styles.secondaryButton}
            >
              <ThemedText
                type="smallBold"
                style={styles.secondaryButtonText}
              >
                {missingAccount ? 'Log out and sign in again' : 'Back to Role Select'}
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const ageWeightPassed =
    donor.eligibility?.ageWeightOk === true;

  const donationIntervalPassed =
    donor.eligibility?.donationIntervalOk === true;

  const medicalSafetyPassed =
    donor.eligibility?.medicalSafetyOk === true;

  const overallEligible =
    ageWeightPassed &&
    donationIntervalPassed &&
    medicalSafetyPassed;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Header onBack={goBack} />

          {successMessage && (
            <View style={styles.successBox}>
              <ThemedText
                type="smallBold"
                style={styles.successText}
              >
                ✓ {successMessage}
              </ThemedText>
            </View>
          )}

          {errorMessage && (
            <View style={styles.noticeBox}>
              <ThemedText
                type="small"
                style={styles.noticeText}
              >
                {errorMessage}
              </ThemedText>
            </View>
          )}

          {isEditing ? (
            <>
              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Edit Personal Information
                </ThemedText>

                <Field
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                />

                <Field
                  label="Phone"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />

                <Field
                  label="City"
                  value={editCity}
                  onChangeText={setEditCity}
                />
              </View>

              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Donor Credentials
                </ThemedText>

                <Field
                  label="Age"
                  value={editAge}
                  onChangeText={setEditAge}
                  keyboardType="numeric"
                  placeholder="Enter your age"
                />

                <Field
                  label="Weight (kg)"
                  value={editWeight}
                  onChangeText={setEditWeight}
                  keyboardType="numeric"
                  placeholder="Enter your weight"
                />

                <Field
                  label="Height (cm)"
                  value={editHeight}
                  onChangeText={setEditHeight}
                  keyboardType="numeric"
                  placeholder="Enter your height"
                />

                <Field
                  label="Last Donation (YYYY-MM-DD)"
                  value={editLastDonation}
                  onChangeText={setEditLastDonation}
                  placeholder="Example: 2026-08-10"
                />

                <View style={styles.helpBox}>
                  <ThemedText
                    type="small"
                    style={styles.helpText}
                  >
                    Next eligible donation date is
                    calculated automatically.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Emergency Alerts
                </ThemedText>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextBox}>
                    <ThemedText
                      type="smallBold"
                      style={styles.switchTitle}
                    >
                      Emergency Blood Alerts
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={styles.switchDescription}
                    >
                      Receive notifications about
                      urgent blood requests.
                    </ThemedText>
                  </View>

                  <Switch
                    value={emergencyAlerts}
                    onValueChange={
                      setEmergencyAlerts
                    }
                    trackColor={{
                      false: '#D6DDEA',
                      true: '#A8DCC2',
                    }}
                    thumbColor={
                      emergencyAlerts
                        ? palette.green
                        : '#FFFFFF'
                    }
                  />
                </View>
              </View>

              <View style={styles.editActions}>
                <Pressable
                  onPress={cancelEditing}
                  disabled={isSaving}
                  style={styles.cancelButton}
                >
                  <ThemedText
                    type="smallBold"
                    style={styles.cancelText}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleUpdate}
                  disabled={isSaving}
                  style={[
                    styles.updateButton,
                    isSaving &&
                      styles.disabledButton,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <ThemedText
                      type="smallBold"
                      style={styles.buttonText}
                    >
                      Save Changes
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Personal Information
                </ThemedText>

                <InfoRow
                  label="Full Name"
                  value={donor.name}
                />

                <InfoRow
                  label="NIC"
                  value={
                    donor.nic ?? 'Not available'
                  }
                />

                <InfoRow
                  label="Phone"
                  value={donor.phone}
                />

                <InfoRow
                  label="City"
                  value={donor.city}
                />

                <InfoRow
                  label="Blood Group"
                  value={donor.bloodGroup}
                />
              </View>

              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Donor Status
                </ThemedText>

                <InfoRow
                  label="Availability"
                  value={
                    donor.available
                      ? 'Available'
                      : 'Not Available'
                  }
                />

                <View style={styles.switchRow}>
                  <View style={styles.switchTextBox}>
                    <ThemedText
                      type="smallBold"
                      style={styles.switchTitle}
                    >
                      Emergency Alerts
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={styles.switchDescription}
                    >
                      {donor.emergencyAlerts
                        ? 'You will receive emergency blood request alerts.'
                        : 'Emergency blood request alerts are turned off.'}
                    </ThemedText>
                  </View>

                  <Switch
                    value={
                      donor.emergencyAlerts !==
                      false
                    }
                    onValueChange={
                      handleEmergencyAlertsChange
                    }
                    disabled={isSaving}
                    trackColor={{
                      false: '#D6DDEA',
                      true: '#A8DCC2',
                    }}
                    thumbColor={
                      donor.emergencyAlerts !==
                      false
                        ? palette.green
                        : '#FFFFFF'
                    }
                  />
                </View>

                <InfoRow
                  label="Travel Radius"
                  value={
                    donor.travelRadiusKm !==
                    undefined
                      ? `${donor.travelRadiusKm} km`
                      : 'Not available'
                  }
                />
              </View>

              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Donor Credentials
                </ThemedText>

                <InfoRow
                  label="Age"
                  value={
                    donor.age !== undefined
                      ? `${donor.age} years`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Weight"
                  value={
                    donor.weightKg !== undefined
                      ? `${donor.weightKg} kg`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Height"
                  value={
                    donor.heightCm !== undefined
                      ? `${donor.heightCm} cm`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Last Donation"
                  value={
                    donor.lastDonationAt
                      ? formatDate(
                          donor.lastDonationAt
                        )
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Next Eligible Donation"
                  value={
                    nextEligibleDonation ??
                    'Not available'
                  }
                />
              </View>

              <View style={styles.section}>
                <ThemedText
                  type="subtitle"
                  style={styles.sectionTitle}
                >
                  Donation Eligibility
                </ThemedText>

                <EligibilityRow
                  label="Age & Weight"
                  passed={ageWeightPassed}
                />

                <EligibilityRow
                  label="Donation Interval"
                  passed={
                    donationIntervalPassed
                  }
                />

                <EligibilityRow
                  label="Medical Safety"
                  passed={
                    medicalSafetyPassed
                  }
                />

                <View
                  style={[
                    styles.overallBox,
                    overallEligible
                      ? styles.overallEligible
                      : styles.overallPending,
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={styles.overallLabel}
                  >
                    Overall Status
                  </ThemedText>

                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.overallStatus,
                      overallEligible
                        ? styles.eligibleText
                        : styles.pendingText,
                    ]}
                  >
                    {overallEligible
                      ? '✓ Eligible to Donate'
                      : 'Eligibility Not Confirmed'}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                onPress={startEditing}
                disabled={isDeleting}
                style={styles.updateButton}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.buttonText}
                >
                  Update Profile
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={askDelete}
                disabled={isDeleting}
                style={[
                  styles.deleteButton,
                  isDeleting &&
                    styles.disabledDeleteButton,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator
                    color={palette.red}
                  />
                ) : (
                  <ThemedText
                    type="smallBold"
                    style={styles.deleteText}
                  >
                    Delete Account
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                onPress={askLogout}
                disabled={isDeleting}
                style={styles.logoutButton}
              >
                <ThemedText
                  type="smallBold"
                  style={styles.logoutText}
                >
                  Logout
                </ThemedText>
              </Pressable>
            </>
          )}

          {action === 'delete' && (
            <ConfirmationBox
              title="Delete Account?"
              message="This will permanently delete your donor account. This action cannot be undone."
              confirmText="Delete Account"
              danger
              disabled={isDeleting}
              onCancel={cancelAction}
              onConfirm={confirmDelete}
            />
          )}

          {action === 'logout' && (
            <ConfirmationBox
              title="Logout?"
              message="Are you sure you want to logout from this donor account?"
              confirmText="Logout"
              disabled={isDeleting}
              onCancel={cancelAction}
              onConfirm={confirmLogout}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function calculateNextDonationDate(
  lastDonationAt: string
) {
  const date = new Date(lastDonationAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + 84);

  return formatDate(date.toISOString());
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString();
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <ThemedText
        type="smallBold"
        style={styles.fieldLabel}
      >
        {label}
      </ThemedText>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={
          placeholder ?? label
        }
        placeholderTextColor={palette.muted}
      />
    </View>
  );
}

function ConfirmationBox({
  title,
  message,
  confirmText,
  danger,
  disabled,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.confirmationBox}>
      <ThemedText
        type="subtitle"
        style={styles.confirmationTitle}
      >
        {title}
      </ThemedText>

      <ThemedText
        type="small"
        style={styles.confirmationMessage}
      >
        {message}
      </ThemedText>

      <View style={styles.confirmationActions}>
        <Pressable
          onPress={onCancel}
          disabled={disabled}
          style={styles.cancelButton}
        >
          <ThemedText
            type="smallBold"
            style={styles.cancelText}
          >
            Cancel
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onConfirm}
          disabled={disabled}
          style={[
            danger
              ? styles.confirmDeleteButton
              : styles.confirmLogoutButton,
            disabled &&
              styles.disabledButton,
          ]}
        >
          {disabled ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText
              type="smallBold"
              style={styles.buttonText}
            >
              {confirmText}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Header({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.backButton}
      >
        <ThemedText style={styles.backText}>
          ‹
        </ThemedText>
      </Pressable>

      <View style={styles.headerTitle}>
        <ThemedText
          type="subtitle"
          style={styles.heading}
        >
          Profile
        </ThemedText>

        <ThemedText
          type="small"
          style={styles.headerSub}
        >
          Donor Account
        </ThemedText>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <ThemedText
        type="small"
        style={styles.rowLabel}
      >
        {label}
      </ThemedText>

      <ThemedText
        type="smallBold"
        style={styles.rowValue}
      >
        {value}
      </ThemedText>
    </View>
  );
}

function EligibilityRow({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <View style={styles.eligibilityRow}>
      <ThemedText
        type="small"
        style={styles.rowLabel}
      >
        {label}
      </ThemedText>

      <View
        style={[
          styles.badge,
          passed
            ? styles.passedBadge
            : styles.pendingBadge,
        ]}
      >
        <ThemedText
          type="smallBold"
          style={
            passed
              ? styles.passedText
              : styles.pendingText
          }
        >
          {passed
            ? '✓ Passed'
            : 'Not confirmed'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.canvas,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 100,
    gap: Spacing.three,
  },

  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },

  backText: {
    color: palette.ink,
    fontSize: 30,
    lineHeight: 32,
  },

  headerTitle: {
    flex: 1,
    marginLeft: Spacing.one,
  },

  heading: {
    color: palette.red,
    fontSize: 22,
    lineHeight: 28,
  },

  headerSub: {
    color: palette.blue,
    fontSize: 12,
  },

  section: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 2,
  },

  sectionTitle: {
    color: palette.ink,
    fontSize: 18,
    marginBottom: Spacing.two,
  },

  infoRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 8,
  },

  rowLabel: {
    color: palette.muted,
    flex: 1,
  },

  rowValue: {
    color: palette.ink,
    flex: 1,
    textAlign: 'right',
  },

  switchRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 65,
    paddingVertical: 8,
  },

  switchTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  switchTitle: {
    color: palette.ink,
  },

  switchDescription: {
    color: palette.muted,
    lineHeight: 18,
    marginTop: 3,
  },

  eligibilityRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
  },

  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  passedBadge: {
    backgroundColor: palette.greenSoft,
  },

  pendingBadge: {
    backgroundColor: palette.yellowSoft,
  },

  passedText: {
    color: palette.green,
  },

  pendingText: {
    color: palette.yellow,
  },

  overallBox: {
    borderRadius: 10,
    marginTop: Spacing.two,
    padding: Spacing.two,
  },

  overallEligible: {
    backgroundColor: palette.greenSoft,
  },

  overallPending: {
    backgroundColor: palette.yellowSoft,
  },

  overallLabel: {
    color: palette.blue,
  },

  overallStatus: {
    marginTop: 4,
  },

  eligibleText: {
    color: palette.green,
  },

  noticeBox: {
    backgroundColor: palette.redSoft,
    borderRadius: 12,
    padding: Spacing.three,
  },

  noticeText: {
    color: palette.red,
  },

  successBox: {
    backgroundColor: palette.greenSoft,
    borderRadius: 12,
    padding: Spacing.three,
  },

  successText: {
    color: palette.green,
  },

  updateButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    flex: 1,
  },

  secondaryButton: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: Spacing.two,
    minHeight: 52,
  },

  secondaryButtonText: {
    color: palette.ink,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
  },

  deleteButton: {
    alignItems: 'center',
    backgroundColor: palette.redSoft,
    borderColor: palette.red,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },

  disabledDeleteButton: {
    opacity: 0.6,
  },

  deleteText: {
    color: palette.red,
  },

  logoutButton: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },

  logoutText: {
    color: palette.muted,
  },

  fieldContainer: {
    marginBottom: Spacing.two,
  },

  fieldLabel: {
    color: palette.ink,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F8F9FC',
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.ink,
    minHeight: 48,
    paddingHorizontal: 12,
  },

  helpBox: {
    backgroundColor: '#F0F7FA',
    borderRadius: 10,
    marginTop: 4,
    padding: 12,
  },

  helpText: {
    color: palette.blue,
    lineHeight: 19,
  },

  editActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },

  cancelButton: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },

  cancelText: {
    color: palette.muted,
  },

  confirmationBox: {
    backgroundColor: palette.surface,
    borderColor: palette.red,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },

  confirmationTitle: {
    color: palette.ink,
    fontSize: 19,
    marginBottom: 8,
  },

  confirmationMessage: {
    color: palette.muted,
    lineHeight: 20,
  },

  confirmationActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
    marginTop: Spacing.three,
  },

  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },

  confirmLogoutButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
});
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BloodComponent,
  Hospital,
  hospitalApi,
  transferApi,
} from '@/lib/hospitalApi';
import {
  DemoRole,
  getDemoSession,
  setDemoRole,
  subscribeDemoSession,
} from '@/lib/demoSession';
import { AppIcon } from '@/components/blood-banks/AppIcon';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const TRANSIT_MODES = ['Personal Vehicle', 'Ambulance Courier', 'Motorcycle Dispatch'];

export default function StartTransferScreen() {
  const { hospital: hospitalIdParam } = useLocalSearchParams<{ hospital: string }>();
  const router = useRouter();
  const [demoRole, setRoleState] = useState<DemoRole>(getDemoSession().role);

  // Form fields
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    hospitalIdParam || ''
  );
  const [donorName, setDonorName] = useState('Nimal Perera');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [component] = useState<BloodComponent>('whole_blood');
  const [units, setUnits] = useState('1');
  const [etaMinutes, setEtaMinutes] = useState('8');
  const [ward, setWard] = useState('ICU Bay 12');
  const [attendingStaff, setAttendingStaff] = useState('Dr. Samantha W.');
  const [transitMode, setTransitMode] = useState('Personal Vehicle');
  const [vehicleInfo, setVehicleInfo] = useState(
    'White Prius (WP-CAB-4912) • Security Pre-Cleared'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDemoSession((s) => {
      setRoleState(s.role);
    });
  }, []);

  useEffect(() => {
    hospitalApi
      .list()
      .then((data) => {
        setHospitals(data);
        if (!selectedHospitalId && data.length > 0) {
          setSelectedHospitalId(data[0]._id);
        }
      })
      .catch(() => {});
  }, [selectedHospitalId]);

  const isStaff = demoRole === 'hospital_staff';

  const handleSubmit = async () => {
    if (!selectedHospitalId) {
      setErrorMessage('Please select a destination hospital.');
      return;
    }
    if (!donorName.trim()) {
      setErrorMessage('Donor name is required.');
      return;
    }

    const etaNum = parseInt(etaMinutes, 10);
    if (isNaN(etaNum) || etaNum < 0) {
      setErrorMessage('ETA minutes must be a valid positive number.');
      return;
    }

    const unitsNum = parseInt(units, 10);
    if (isNaN(unitsNum) || unitsNum < 1) {
      setErrorMessage('Units must be an integer of at least 1.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await transferApi.create({
        hospital: selectedHospitalId,
        donorName: donorName.trim(),
        bloodGroup,
        component,
        units: unitsNum,
        etaMinutes: etaNum,
        ward: ward.trim(),
        attendingStaff: attendingStaff.trim(),
        transitMode,
        vehicleInfo: vehicleInfo.trim(),
      });

      router.replace(`/transfers/${created._id}` as any);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error || 'Failed to dispatch transfer. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isStaff) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="back" size={22} tintColor="#14253B" />
          </Pressable>
          <Text style={styles.headerTitle}>Start Transfer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.unauthorizedContainer}>
          <View style={styles.lockIconBox}>
            <AppIcon name="truck" size={36} tintColor="#0878A8" />
          </View>
          <Text style={styles.unauthorizedTitle}>Hospital Staff Only</Text>
          <Text style={styles.unauthorizedText}>
            Dispatching and initiating donor transfer coordination requires verified Hospital Staff privileges.
          </Text>

          <Pressable
            style={styles.switchRoleBtn}
            onPress={() => setDemoRole('hospital_staff')}
            accessibilityRole="button"
            accessibilityLabel="Switch to Hospital Staff demo role"
          >
            <Text style={styles.switchRoleBtnText}>
              Switch to Hospital Staff (DEV)
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={22} tintColor="#14253B" />
        </Pressable>
        <Text style={styles.headerTitle}>Start In-Transit Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>DESTINATION HOSPITAL</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hospitalScroll}
          contentContainerStyle={styles.hospitalScrollContent}
        >
          {hospitals.map((h) => {
            const isSelected = selectedHospitalId === h._id;
            return (
              <Pressable
                key={h._id}
                style={[
                  styles.hospitalChip,
                  isSelected && styles.hospitalChipActive,
                ]}
                onPress={() => setSelectedHospitalId(h._id)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${h.name}`}
              >
                <Text
                  style={[
                    styles.hospitalChipText,
                    isSelected && styles.hospitalChipTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {h.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionHeader}>DONOR DETAILS</Text>
        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>DONOR FULL NAME</Text>
          <TextInput
            style={styles.textInput}
            value={donorName}
            onChangeText={setDonorName}
            placeholder="e.g. Nimal Perera"
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>BLOOD GROUP</Text>
          <View style={styles.bloodGrid}>
            {BLOOD_GROUPS.map((bg) => (
              <Pressable
                key={bg}
                style={[
                  styles.bloodChip,
                  bloodGroup === bg && styles.bloodChipActive,
                ]}
                onPress={() => setBloodGroup(bg)}
              >
                <Text
                  style={[
                    styles.bloodChipText,
                    bloodGroup === bg && styles.bloodChipTextActive,
                  ]}
                >
                  {bg}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>UNITS</Text>
              <TextInput
                style={styles.textInput}
                value={units}
                onChangeText={setUnits}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>ETA (MINUTES)</Text>
              <TextInput
                style={styles.textInput}
                value={etaMinutes}
                onChangeText={setEtaMinutes}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>WARD & CLINICAL DESTINATION</Text>
        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>WARD / TRIAGE UNIT</Text>
          <TextInput
            style={styles.textInput}
            value={ward}
            onChangeText={setWard}
            placeholder="e.g. ICU Bay 12"
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            ATTENDING CLINICIAN / NURSE
          </Text>
          <TextInput
            style={styles.textInput}
            value={attendingStaff}
            onChangeText={setAttendingStaff}
            placeholder="e.g. Dr. Samantha W."
          />
        </View>

        <Text style={styles.sectionHeader}>TRANSIT & VEHICLE</Text>
        <View style={styles.inputCard}>
          <Text style={styles.fieldLabel}>TRANSIT MODE</Text>
          <View style={styles.transitModeRow}>
            {TRANSIT_MODES.map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.transitModeChip,
                  transitMode === mode && styles.transitModeChipActive,
                ]}
                onPress={() => setTransitMode(mode)}
              >
                <Text
                  style={[
                    styles.transitModeText,
                    transitMode === mode && styles.transitModeTextActive,
                  ]}
                >
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            VEHICLE & SECURITY PRE-CLEARANCE
          </Text>
          <TextInput
            style={styles.textInput}
            value={vehicleInfo}
            onChangeText={setVehicleInfo}
            placeholder="e.g. White Prius (WP-CAB-4912) • Security Pre-Cleared"
          />
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <AppIcon name="warning" size={16} tintColor="#E7194F" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Dispatch transfer and initiate tracking"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              Dispatch Donor & Open Coordination
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5EC',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14253B',
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  hospitalScroll: {
    marginBottom: 8,
  },
  hospitalScrollContent: {
    gap: 8,
  },
  hospitalChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#FFFFFF',
    maxWidth: 200,
  },
  hospitalChipActive: {
    borderColor: '#0878A8',
    backgroundColor: '#E6F4FF',
  },
  hospitalChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14253B',
  },
  hospitalChipTextActive: {
    color: '#0878A8',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5EC',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6E7180',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F7F8FF',
    borderWidth: 1,
    borderColor: '#D6DDEA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#14253B',
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  bloodChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
  },
  bloodChipActive: {
    backgroundColor: '#E7194F',
    borderColor: '#E7194F',
  },
  bloodChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14253B',
  },
  bloodChipTextActive: {
    color: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  col: {
    flex: 1,
  },
  transitModeRow: {
    gap: 6,
  },
  transitModeChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6DDEA',
    backgroundColor: '#F7F8FF',
  },
  transitModeChipActive: {
    borderColor: '#0878A8',
    backgroundColor: '#E6F4FF',
  },
  transitModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14253B',
  },
  transitModeTextActive: {
    color: '#0878A8',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE7EE',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  errorText: {
    color: '#E7194F',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#E7194F',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  unauthorizedContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unauthorizedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14253B',
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 13,
    color: '#6E7180',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 280,
  },
  switchRoleBtn: {
    backgroundColor: '#0878A8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  switchRoleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

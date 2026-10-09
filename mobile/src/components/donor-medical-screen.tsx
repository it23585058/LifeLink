import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

import {
  donorManagementApi,
  medicalDocumentApi,
  type DonorProfile,
  type MedicalDocument,
} from '@/lib/donor-api';

import { donorSession } from '@/lib/donor-session';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const colors = {
  background: '#F7F8FF',
  card: '#FFFFFF',
  text: '#14253B',
  muted: '#6E7180',
  border: '#D6DDEA',

  red: '#E7194F',
  redSoft: '#FFE7EE',

  blue: '#0878A8',
  blueSoft: '#EAF4FF',

  green: '#087A3E',
  greenSoft: '#E7F7EF',

  warning: '#9A6700',
  warningSoft: '#FFF3D6',

  critical: '#B42318',
  criticalSoft: '#FDE7E7',
};

type WarningLevel =
  | 'info'
  | 'warning'
  | 'critical';

type MedicalWarning = {
  level: WarningLevel;
  title: string;
  message: string;
};

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemedText
      type="subtitle"
      style={styles.sectionTitle}
    >
      {children}
    </ThemedText>
  );
}

/* =========================================================
   WARNING HELPERS
========================================================= */

function getBloodPressureWarning(
  input: string
): MedicalWarning | null {
  const value = input.trim();

  if (!value) {
    return null;
  }

  const match = value.match(
    /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/
  );

  if (!match) {
    return {
      level: 'warning',
      title: 'Check blood pressure format',
      message:
        'Enter blood pressure as systolic/diastolic, for example 120/80.',
    };
  }

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);

  if (
    systolic < 50 ||
    systolic > 260 ||
    diastolic < 30 ||
    diastolic > 160 ||
    systolic <= diastolic
  ) {
    return {
      level: 'warning',
      title: 'Check this blood pressure reading',
      message:
        'This reading may be incorrect. Please confirm the measurement with a reliable device or healthcare professional.',
    };
  }

  if (
    systolic >= 180 ||
    diastolic >= 120
  ) {
    return {
      level: 'critical',
      title: 'Very high blood pressure',
      message:
        'Repeat the measurement and seek urgent medical advice. If you have chest pain, shortness of breath, weakness, confusion or vision changes, seek emergency care.',
    };
  }

  if (
    systolic < 90 ||
    diastolic < 60 ||
    systolic >= 140 ||
    diastolic >= 90
  ) {
    return {
      level: 'warning',
      title: 'Blood pressure needs review',
      message:
        'This reading is outside the usual adult reference range. Recheck it and ask qualified donation staff to assess you before donating.',
    };
  }

  if (
    systolic >= 130 ||
    diastolic >= 80
  ) {
    return {
      level: 'info',
      title: 'Blood pressure should be reviewed',
      message:
        'This reading may be above the ideal range. Donation suitability must be assessed by qualified staff.',
    };
  }

  return null;
}

function getHemoglobinWarning(
  input: string
): MedicalWarning | null {
  const value = input.trim();

  if (!value) {
    return null;
  }

  const hemoglobin = Number(value);

  if (
    !Number.isFinite(hemoglobin) ||
    hemoglobin < 1 ||
    hemoglobin > 30
  ) {
    return {
      level: 'warning',
      title: 'Invalid hemoglobin value',
      message:
        'Enter a numeric value between 1 and 30 g/dL.',
    };
  }

  if (hemoglobin < 5) {
    return {
      level: 'critical',
      title: 'Critically low hemoglobin',
      message:
        'This value is extremely low if accurate. Please seek urgent medical assessment and do not donate blood until appropriately assessed by qualified medical staff.',
    };
  }

  if (hemoglobin < 8) {
    return {
      level: 'critical',
      title: 'Very low hemoglobin',
      message:
        'Please contact a healthcare professional promptly. Do not proceed with blood donation until medically assessed.',
    };
  }

  if (hemoglobin < 12) {
    return {
      level: 'warning',
      title: 'Low hemoglobin',
      message:
        'This may be below the usual adult reference range. Ask a healthcare professional to review the result before donating blood.',
    };
  }

  if (hemoglobin > 20) {
    return {
      level: 'warning',
      title: 'High hemoglobin',
      message:
        'Confirm this laboratory result and seek medical advice. Donation suitability requires professional assessment.',
    };
  }

  return null;
}

function getMedicalReviewWarnings({
  diabetes,
  highBloodPressure,
  heartDisease,
  currentlySick,
}: {
  diabetes: boolean;
  highBloodPressure: boolean;
  heartDisease: boolean;
  currentlySick: boolean;
}): MedicalWarning[] {
  const warnings: MedicalWarning[] = [];

  if (diabetes) {
    warnings.push({
      level: 'warning',
      title: 'Diabetes reported',
      message:
        'A healthcare professional should assess your condition and treatment before donation.',
    });
  }

  if (highBloodPressure) {
    warnings.push({
      level: 'warning',
      title: 'High blood pressure reported',
      message:
        'Your current blood pressure and treatment should be reviewed by donation staff.',
    });
  }

  if (heartDisease) {
    warnings.push({
      level: 'warning',
      title: 'Heart disease reported',
      message:
        'Obtain an individual assessment from qualified medical staff before donating.',
    });
  }

  if (currentlySick) {
    warnings.push({
      level: 'warning',
      title: 'Current illness reported',
      message:
        'Donation may need to be postponed. Contact donation staff for an assessment.',
    });
  }

  return warnings;
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export function DonorMedicalScreen() {
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

  const [isSaving, setIsSaving] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [bloodPressure, setBloodPressure] =
    useState('');

  const [hemoglobin, setHemoglobin] =
    useState('');

  const [diabetes, setDiabetes] =
    useState(false);

  const [highBloodPressure, setHighBloodPressure] =
    useState(false);

  const [heartDisease, setHeartDisease] =
    useState(false);

  const [
    otherMedicalConditions,
    setOtherMedicalConditions,
  ] = useState('');

  const [
    previousSurgeries,
    setPreviousSurgeries,
  ] = useState('');

  const [currentlySick, setCurrentlySick] =
    useState(false);

  const [
    takingMedication,
    setTakingMedication,
  ] = useState(false);

  const [
    medicationDetails,
    setMedicationDetails,
  ] = useState('');

  const [allergies, setAllergies] =
    useState('');

  const [
    recentDonationComplications,
    setRecentDonationComplications,
  ] = useState('');

  const [documents, setDocuments] =
    useState<MedicalDocument[]>([]);

  const [
    isUploadingDocument,
    setIsUploadingDocument,
  ] = useState(false);

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] = useState<string | null>(null);

  const [
    documentMessage,
    setDocumentMessage,
  ] = useState<string | null>(null);

  const bloodPressureWarning =
    getBloodPressureWarning(
      bloodPressure
    );

  const hemoglobinWarning =
    getHemoglobinWarning(
      hemoglobin
    );

  const loadMedicalFields = (
    data: DonorProfile
  ) => {
    setBloodPressure(
      data.bloodPressure ?? ''
    );

    setHemoglobin(
      data.hemoglobin != null
        ? String(data.hemoglobin)
        : ''
    );

    setDiabetes(
      data.diabetes === true
    );

    setHighBloodPressure(
      data.highBloodPressure === true
    );

    setHeartDisease(
      data.heartDisease === true
    );

    setOtherMedicalConditions(
      data.otherMedicalConditions ?? ''
    );

    setPreviousSurgeries(
      data.previousSurgeries ?? ''
    );

    setCurrentlySick(
      data.currentlySick === true
    );

    setTakingMedication(
      data.takingMedication === true
    );

    setMedicationDetails(
      data.medicationDetails ?? ''
    );

    setAllergies(
      data.allergies ?? ''
    );

    setRecentDonationComplications(
      data.recentDonationComplications ?? ''
    );
  };

  const loadDocuments = async (
    activeDonorId: string
  ) => {
    try {
      const data =
        await medicalDocumentApi.list(
          activeDonorId
        );

      setDocuments(data);
    } catch {
      setDocuments([]);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const storedDonorId =
          await donorSession.get();

        const role = await donorSession.getRole();
        if (role && role !== 'donor') {
          if (!cancelled) {
            setErrorMessage('This screen is available only to donor accounts.');
          }
          return;
        }

        // Use the authenticated session as the source of truth. Route
        // parameters are retained only for backwards-compatible navigation.
        const activeId =
          storedDonorId ||
          paramDonorId;

        if (!activeId) {
          if (!cancelled) {
            setErrorMessage(
              'No donor account found.'
            );
          }

          return;
        }

        if (!cancelled) {
          setDonorId(activeId);
        }

        const data =
          await donorManagementApi.get(
            activeId
          );

        if (cancelled) {
          return;
        }

        setDonor(data);
        loadMedicalFields(data);

        await loadDocuments(
          activeId
        );
      } catch {
        if (!cancelled) {
          setErrorMessage(
            'Could not load your medical information.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [paramDonorId]);

  const goBack = () => {
    router.back();
  };

  const startEditing = () => {
    if (!donor) {
      return;
    }

    loadMedicalFields(donor);

    setErrorMessage(null);
    setSuccessMessage(null);
    setDocumentMessage(null);

    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (donor) {
      loadMedicalFields(donor);
    }

    setIsEditing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!donorId) {
      setErrorMessage(
        'Donor account could not be identified.'
      );
      return;
    }

    let hemoglobinValue:
      | number
      | undefined;

    if (hemoglobin.trim()) {
      const value = Number(
        hemoglobin.trim()
      );

      if (
        !Number.isFinite(value) ||
        value < 1 ||
        value > 30
      ) {
        setErrorMessage(
          'Hemoglobin must be a number between 1 and 30 g/dL.'
        );
        return;
      }

      hemoglobinValue = value;
    }

    if (bloodPressure.trim()) {
      const match =
        bloodPressure
          .trim()
          .match(
            /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/
          );

      if (!match) {
        setErrorMessage(
          'Enter Blood Pressure in the format 120/80.'
        );
        return;
      }

      const systolic = Number(
        match[1]
      );

      const diastolic = Number(
        match[2]
      );

      if (
        systolic < 50 ||
        systolic > 260 ||
        diastolic < 30 ||
        diastolic > 160 ||
        systolic <= diastolic
      ) {
        setErrorMessage(
          'Please check the Blood Pressure reading before saving.'
        );
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updated =
        await donorManagementApi.update(
          donorId,
          {
            bloodPressure:
              bloodPressure.trim() ||
              undefined,

            hemoglobin:
              hemoglobinValue,

            diabetes,

            highBloodPressure,

            heartDisease,

            otherMedicalConditions:
              otherMedicalConditions.trim() ||
              undefined,

            previousSurgeries:
              previousSurgeries.trim() ||
              undefined,

            currentlySick,

            takingMedication,

            medicationDetails:
              takingMedication
                ? medicationDetails.trim() ||
                  undefined
                : undefined,

            allergies:
              allergies.trim() ||
              undefined,

            recentDonationComplications:
              recentDonationComplications.trim() ||
              undefined,
          }
        );

      setDonor(updated);
      loadMedicalFields(updated);
      setIsEditing(false);

      setSuccessMessage(
        'Medical information updated successfully.'
      );
    } catch {
      setErrorMessage(
        'Could not update medical information. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     MEDICAL DOCUMENT UPLOAD
     ======================================================= */

  const handleUploadDocument = async () => {
    if (!donorId) {
      setDocumentMessage(
        'Donor account could not be identified.'
      );
      return;
    }

    try {
      setDocumentMessage(null);

      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'image/jpeg',
            'image/png',
          ],

          copyToCacheDirectory: true,

          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const selectedFile =
        result.assets?.[0];

      if (!selectedFile) {
        setDocumentMessage(
          'No document was selected.'
        );
        return;
      }

      const fileName =
        selectedFile.name ||
        'medical-document';

      const extension =
        fileName
          .split('.')
          .pop()
          ?.toLowerCase();

      const allowedExtensions = [
        'pdf',
        'jpg',
        'jpeg',
        'png',
      ];

      if (
        !extension ||
        !allowedExtensions.includes(
          extension
        )
      ) {
        setDocumentMessage(
          'Only PDF, JPG, JPEG and PNG files are allowed.'
        );
        return;
      }

      if (
        selectedFile.size != null &&
        selectedFile.size >
          10 * 1024 * 1024
      ) {
        setDocumentMessage(
          'The maximum document size is 10 MB.'
        );
        return;
      }

      const mimeType =
        selectedFile.mimeType ||
        getMimeTypeFromExtension(
          extension
        );

      /*
       * IMPORTANT:
       *
       * On Expo Web, DocumentPicker provides
       * the actual browser File object through
       * asset.file.
       */
      const webFile =
        Platform.OS === 'web'
          ? (selectedFile as any)
              .file
          : undefined;

      if (
        Platform.OS === 'web' &&
        !webFile
      ) {
        setDocumentMessage(
          'Could not access the selected file. Please select the document again.'
        );
        return;
      }

      setIsUploadingDocument(true);

      const uploaded =
        await medicalDocumentApi.upload(
          donorId,
          {
            uri:
              selectedFile.uri,

            name:
              fileName,

            mimeType,

            webFile,
          }
        );

      setDocuments(
        (current) => [
          uploaded,
          ...current,
        ]
      );

      setDocumentMessage(
        'Medical document uploaded successfully.'
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        'Could not upload the medical document. Please try again.';

      setDocumentMessage(
        errorMessage
      );
    } finally {
      setIsUploadingDocument(
        false
      );
    }
  };

  const handleDeleteDocument =
    async (
      documentId: string
    ) => {
      if (!donorId) {
        return;
      }

      try {
        setDeletingDocumentId(
          documentId
        );

        setDocumentMessage(null);

        await medicalDocumentApi.remove(
          donorId,
          documentId
        );

        setDocuments(
          (current) =>
            current.filter(
              (document) =>
                document._id !==
                documentId
            )
        );

        setDocumentMessage(
          'Medical document deleted.'
        );
      } catch {
        setDocumentMessage(
          'Could not delete the medical document.'
        );
      } finally {
        setDeletingDocumentId(
          null
        );
      }
    };

  if (isLoading) {
    return (
      <ThemedView
        style={styles.screen}
      >
        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}
        >
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={colors.red}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!donor) {
    return (
      <ThemedView
        style={styles.screen}
      >
        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}
        >
          <View
            style={styles.content}
          >
            <Header
              onBack={goBack}
            />

            <View
              style={styles.errorBox}
            >
              <ThemedText
                type="small"
                style={
                  styles.errorText
                }
              >
                {errorMessage ??
                  'Could not load medical information.'}
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={styles.screen}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <Header
            onBack={goBack}
          />

          {successMessage && (
            <View
              style={
                styles.successBox
              }
            >
              <ThemedText
                type="smallBold"
                style={
                  styles.successText
                }
              >
                ✓ {successMessage}
              </ThemedText>
            </View>
          )}

          {errorMessage && (
            <View
              style={
                styles.errorBox
              }
            >
              <ThemedText
                type="small"
                style={
                  styles.errorText
                }
              >
                {errorMessage}
              </ThemedText>
            </View>
          )}

          {!isEditing ? (
            <>
              <View
                style={styles.section}
              >
                <SectionTitle>
                  Basic Health
                </SectionTitle>

                <InfoRow
                  label="Age"
                  value={
                    donor.age != null
                      ? `${donor.age} years`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Weight"
                  value={
                    donor.weightKg != null
                      ? `${donor.weightKg} kg`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Height"
                  value={
                    donor.heightCm != null
                      ? `${donor.heightCm} cm`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Blood Pressure"
                  value={
                    donor.bloodPressure ||
                    'Not available'
                  }
                />

                <InfoRow
                  label="Hemoglobin"
                  value={
                    donor.hemoglobin !=
                    null
                      ? `${donor.hemoglobin} g/dL`
                      : 'Not available'
                  }
                />

                {donor.bloodPressure && (
                  <MedicalWarningDisplay
                    warning={getBloodPressureWarning(
                      donor.bloodPressure
                    )}
                  />
                )}

                {donor.hemoglobin !=
                  null && (
                  <MedicalWarningDisplay
                    warning={getHemoglobinWarning(
                      String(
                        donor.hemoglobin
                      )
                    )}
                  />
                )}
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Medical History
                </SectionTitle>

                <InfoRow
                  label="Diabetes"
                  value={
                    donor.diabetes
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="High Blood Pressure"
                  value={
                    donor.highBloodPressure
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="Heart Disease"
                  value={
                    donor.heartDisease
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="Other Medical Conditions"
                  value={
                    donor.otherMedicalConditions ||
                    'None'
                  }
                />

                <InfoRow
                  label="Previous Surgeries"
                  value={
                    donor.previousSurgeries ||
                    'None'
                  }
                />

                {getMedicalReviewWarnings({
                  diabetes:
                    donor.diabetes ===
                    true,

                  highBloodPressure:
                    donor.highBloodPressure ===
                    true,

                  heartDisease:
                    donor.heartDisease ===
                    true,

                  currentlySick:
                    donor.currentlySick ===
                    true,
                }).map(
                  (warning) => (
                    <MedicalWarningBox
                      key={
                        warning.title
                      }
                      warning={
                        warning
                      }
                    />
                  )
                )}
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Current Health
                </SectionTitle>

                <InfoRow
                  label="Currently Sick?"
                  value={
                    donor.currentlySick
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="Taking Medication?"
                  value={
                    donor.takingMedication
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="Medication Details"
                  value={
                    donor.medicationDetails ||
                    'None'
                  }
                />

                <InfoRow
                  label="Allergies"
                  value={
                    donor.allergies ||
                    'None'
                  }
                />
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Donation Information
                </SectionTitle>

                <InfoRow
                  label="Last Blood Donation"
                  value={
                    donor.lastDonationAt
                      ? formatDate(
                          donor.lastDonationAt
                        )
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Recent Donation Complications"
                  value={
                    donor.recentDonationComplications ||
                    'None'
                  }
                />
              </View>

              <Pressable
                onPress={
                  startEditing
                }
                style={
                  styles.primaryButton
                }
              >
                <ThemedText
                  type="smallBold"
                  style={
                    styles.primaryButtonText
                  }
                >
                  Update Medical Information
                </ThemedText>
              </Pressable>

              <MedicalDocumentsSection
                documents={documents}
                isUploading={
                  isUploadingDocument
                }
                deletingDocumentId={
                  deletingDocumentId
                }
                documentMessage={
                  documentMessage
                }
                onUpload={
                  handleUploadDocument
                }
                onDelete={
                  handleDeleteDocument
                }
              />
            </>
          ) : (
            <>
              <View
                style={styles.section}
              >
                <SectionTitle>
                  Basic Health
                </SectionTitle>

                <View
                  style={
                    styles.infoNote
                  }
                >
                  <ThemedText
                    type="small"
                    style={
                      styles.infoNoteText
                    }
                  >
                    Age, weight, height and
                    last donation date are
                    managed from your Profile
                    page.
                  </ThemedText>
                </View>

                <InfoRow
                  label="Age"
                  value={
                    donor.age != null
                      ? `${donor.age} years`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Weight"
                  value={
                    donor.weightKg != null
                      ? `${donor.weightKg} kg`
                      : 'Not available'
                  }
                />

                <InfoRow
                  label="Height"
                  value={
                    donor.heightCm != null
                      ? `${donor.heightCm} cm`
                      : 'Not available'
                  }
                />

                <Field
                  label="Blood Pressure (mmHg)"
                  value={
                    bloodPressure
                  }
                  onChangeText={
                    setBloodPressure
                  }
                  placeholder="Example: 120/80"
                />

                <MedicalWarningDisplay
                  warning={
                    bloodPressureWarning
                  }
                />

                <Field
                  label="Hemoglobin (g/dL)"
                  value={
                    hemoglobin
                  }
                  onChangeText={
                    setHemoglobin
                  }
                  keyboardType="decimal-pad"
                  placeholder="Example: 13.5"
                />

                <MedicalWarningDisplay
                  warning={
                    hemoglobinWarning
                  }
                />
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Medical History
                </SectionTitle>

                <SwitchField
                  label="Diabetes"
                  description="Do you have diabetes?"
                  value={diabetes}
                  onValueChange={
                    setDiabetes
                  }
                />

                {diabetes && (
                  <MedicalWarningBox
                    warning={{
                      level:
                        'warning',
                      title:
                        'Diabetes reported',
                      message:
                        'A healthcare professional should assess your condition and treatment before donation.',
                    }}
                  />
                )}

                <SwitchField
                  label="High Blood Pressure"
                  description="Do you have high blood pressure?"
                  value={
                    highBloodPressure
                  }
                  onValueChange={
                    setHighBloodPressure
                  }
                />

                {highBloodPressure && (
                  <MedicalWarningBox
                    warning={{
                      level:
                        'warning',
                      title:
                        'High blood pressure reported',
                      message:
                        'Your current blood pressure and treatment should be reviewed by donation staff.',
                    }}
                  />
                )}

                <SwitchField
                  label="Heart Disease"
                  description="Do you have any heart disease?"
                  value={
                    heartDisease
                  }
                  onValueChange={
                    setHeartDisease
                  }
                />

                {heartDisease && (
                  <MedicalWarningBox
                    warning={{
                      level:
                        'warning',
                      title:
                        'Heart disease reported',
                      message:
                        'Obtain an individual assessment from qualified medical staff before donating.',
                    }}
                  />
                )}

                <Field
                  label="Other Medical Conditions"
                  value={
                    otherMedicalConditions
                  }
                  onChangeText={
                    setOtherMedicalConditions
                  }
                  placeholder="Enter other conditions, or None"
                  multiline
                />

                <Field
                  label="Previous Surgeries"
                  value={
                    previousSurgeries
                  }
                  onChangeText={
                    setPreviousSurgeries
                  }
                  placeholder="Enter previous surgeries, or None"
                  multiline
                />
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Current Health
                </SectionTitle>

                <SwitchField
                  label="Currently Sick?"
                  description="Are you currently sick or unwell?"
                  value={
                    currentlySick
                  }
                  onValueChange={
                    setCurrentlySick
                  }
                />

                {currentlySick && (
                  <MedicalWarningBox
                    warning={{
                      level:
                        'warning',
                      title:
                        'Current illness reported',
                      message:
                        'Donation may need to be postponed. Contact donation staff for an assessment.',
                    }}
                  />
                )}

                <SwitchField
                  label="Taking Medication?"
                  description="Are you currently taking medication?"
                  value={
                    takingMedication
                  }
                  onValueChange={
                    setTakingMedication
                  }
                />

                {takingMedication && (
                  <Field
                    label="Medication Details"
                    value={
                      medicationDetails
                    }
                    onChangeText={
                      setMedicationDetails
                    }
                    placeholder="Enter medication details"
                    multiline
                  />
                )}

                <Field
                  label="Allergies"
                  value={
                    allergies
                  }
                  onChangeText={
                    setAllergies
                  }
                  placeholder="Enter known allergies, or None"
                  multiline
                />
              </View>

              <View
                style={styles.section}
              >
                <SectionTitle>
                  Donation Information
                </SectionTitle>

                <InfoRow
                  label="Last Blood Donation"
                  value={
                    donor.lastDonationAt
                      ? formatDate(
                          donor.lastDonationAt
                        )
                      : 'Not available'
                  }
                />

                <Field
                  label="Recent Donation Complications"
                  value={
                    recentDonationComplications
                  }
                  onChangeText={
                    setRecentDonationComplications
                  }
                  placeholder="Describe complications, or None"
                  multiline
                />
              </View>

              <View
                style={styles.infoNote}
              >
                <ThemedText
                  type="small"
                  style={
                    styles.infoNoteText
                  }
                >
                  These warnings are
                  informational only. They do
                  not determine final blood
                  donation eligibility. Qualified
                  donation staff must make the
                  final assessment.
                </ThemedText>
              </View>

              <View
                style={styles.actionRow}
              >
                <Pressable
                  onPress={
                    cancelEditing
                  }
                  disabled={
                    isSaving
                  }
                  style={
                    styles.cancelButton
                  }
                >
                  <ThemedText
                    type="smallBold"
                    style={
                      styles.cancelText
                    }
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={
                    handleSave
                  }
                  disabled={
                    isSaving
                  }
                  style={[
                    styles.primaryButton,
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
                      style={
                        styles.primaryButtonText
                      }
                    >
                      Save Medical Information
                    </ThemedText>
                  )}
                </Pressable>
              </View>

              <MedicalDocumentsSection
                documents={documents}
                isUploading={
                  isUploadingDocument
                }
                deletingDocumentId={
                  deletingDocumentId
                }
                documentMessage={
                  documentMessage
                }
                onUpload={
                  handleUploadDocument
                }
                onDelete={
                  handleDeleteDocument
                }
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/* =========================================================
   DOCUMENTS
========================================================= */

function MedicalDocumentsSection({
  documents,
  isUploading,
  deletingDocumentId,
  documentMessage,
  onUpload,
  onDelete,
}: {
  documents: MedicalDocument[];
  isUploading: boolean;
  deletingDocumentId: string | null;
  documentMessage: string | null;
  onUpload: () => void;
  onDelete: (
    documentId: string
  ) => void;
}) {
  return (
    <View
      style={styles.section}
    >
      <SectionTitle>
        Medical Documents
      </SectionTitle>

      <ThemedText
        type="small"
        style={
          styles.documentDescription
        }
      >
        Upload blood reports, medical
        certificates or other documents
        related to your medical information.
      </ThemedText>

      <View
        style={styles.documentInfoBox}
      >
        <ThemedText
          type="small"
          style={
            styles.documentInfoText
          }
        >
          Accepted files: PDF, JPG, JPEG and
          PNG. Maximum size: 10 MB.
        </ThemedText>
      </View>

      {documentMessage && (
        <View
          style={
            styles.documentMessage
          }
        >
          <ThemedText
            type="small"
            style={
              styles.documentMessageText
            }
          >
            {documentMessage}
          </ThemedText>
        </View>
      )}

      <Pressable
        onPress={onUpload}
        disabled={isUploading}
        style={[
          styles.documentButton,
          isUploading &&
            styles.disabledDocumentButton,
        ]}
      >
        {isUploading ? (
          <>
            <ActivityIndicator
              color={colors.blue}
            />

            <ThemedText
              type="smallBold"
              style={
                styles.documentButtonText
              }
            >
              Uploading...
            </ThemedText>
          </>
        ) : (
          <ThemedText
            type="smallBold"
            style={
              styles.documentButtonText
            }
          >
            + Upload Medical Document
          </ThemedText>
        )}
      </Pressable>

      {documents.length === 0 ? (
        <View
          style={
            styles.documentEmpty
          }
        >
          <ThemedText
            type="smallBold"
            style={
              styles.documentTitle
            }
          >
            No medical documents
          </ThemedText>

          <ThemedText
            type="small"
            style={
              styles.documentDescription
            }
          >
            Your uploaded medical documents
            will appear here.
          </ThemedText>
        </View>
      ) : (
        <View
          style={
            styles.documentList
          }
        >
          {documents.map(
            (document) => {
              const isDeleting =
                deletingDocumentId ===
                document._id;

              return (
                <View
                  key={
                    document._id
                  }
                  style={
                    styles.documentItem
                  }
                >
                  <View
                    style={
                      styles.documentIcon
                    }
                  >
                    <ThemedText
                      type="smallBold"
                      style={
                        styles.documentIconText
                      }
                    >
                      {getDocumentIcon(
                        document.mimeType
                      )}
                    </ThemedText>
                  </View>

                  <View
                    style={
                      styles.documentInfo
                    }
                  >
                    <ThemedText
                      type="smallBold"
                      style={
                        styles.documentName
                      }
                      numberOfLines={2}
                    >
                      {
                        document.originalName
                      }
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={
                        styles.documentMeta
                      }
                    >
                      {
                        formatFileSize(
                          document.size
                        )
                      }
                      {' • '}
                      {
                        formatDocumentType(
                          document.mimeType
                        )
                      }
                    </ThemedText>

                    {document.createdAt && (
                      <ThemedText
                        type="small"
                        style={
                          styles.documentMeta
                        }
                      >
                        Uploaded{' '}
                        {formatDate(
                          document.createdAt
                        )}
                      </ThemedText>
                    )}
                  </View>

                  <Pressable
                    onPress={() =>
                      onDelete(
                        document._id
                      )
                    }
                    disabled={
                      isDeleting
                    }
                    style={[
                      styles.deleteDocumentButton,
                      isDeleting &&
                        styles.disabledDeleteButton,
                    ]}
                  >
                    {isDeleting ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          colors.red
                        }
                      />
                    ) : (
                      <ThemedText
                        type="smallBold"
                        style={
                          styles.deleteDocumentText
                        }
                      >
                        Delete
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              );
            }
          )}
        </View>
      )}
    </View>
  );
}

/* =========================================================
   WARNING COMPONENT
========================================================= */

function MedicalWarningDisplay({
  warning,
}: {
  warning: MedicalWarning | null;
}) {
  if (!warning) {
    return null;
  }

  return (
    <MedicalWarningBox
      warning={warning}
    />
  );
}

function MedicalWarningBox({
  warning,
}: {
  warning: MedicalWarning;
}) {
  const isCritical =
    warning.level === 'critical';

  const isWarning =
    warning.level === 'warning';

  const backgroundColor =
    isCritical
      ? colors.criticalSoft
      : isWarning
        ? colors.warningSoft
        : colors.blueSoft;

  const textColor =
    isCritical
      ? colors.critical
      : isWarning
        ? colors.warning
        : colors.blue;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.warningBox,
        {
          backgroundColor,
          borderLeftColor:
            textColor,
        },
      ]}
    >
      <ThemedText
        type="smallBold"
        style={{
          color: textColor,
        }}
      >
        {isCritical
          ? '⚠ '
          : isWarning
            ? '⚠ '
            : 'ℹ '}

        {warning.title}
      </ThemedText>

      <ThemedText
        type="small"
        style={[
          styles.warningMessage,
          {
            color: textColor,
          },
        ]}
      >
        {warning.message}
      </ThemedText>
    </View>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'decimal-pad';
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View
      style={
        styles.fieldContainer
      }
    >
      <ThemedText
        type="smallBold"
        style={
          styles.fieldLabel
        }
      >
        {label}
      </ThemedText>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        keyboardType={
          keyboardType
        }
        placeholder={
          placeholder ??
          label
        }
        placeholderTextColor={
          colors.muted
        }
        multiline={
          multiline
        }
        textAlignVertical={
          multiline
            ? 'top'
            : 'center'
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

/* =========================================================
   SWITCH
========================================================= */

function SwitchField({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (
    value: boolean
  ) => void;
}) {
  return (
    <View
      style={
        styles.switchRow
      }
    >
      <View
        style={
          styles.switchText
        }
      >
        <ThemedText
          type="smallBold"
          style={
            styles.switchLabel
          }
        >
          {label}
        </ThemedText>

        <ThemedText
          type="small"
          style={
            styles.switchDescription
          }
        >
          {description}
        </ThemedText>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        trackColor={{
          false: '#D6DDEA',
          true: '#A8DCC2',
        }}
        thumbColor={
          value
            ? colors.green
            : '#FFFFFF'
        }
      />
    </View>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <ThemedText
        type="small"
        style={
          styles.rowLabel
        }
      >
        {label}
      </ThemedText>

      <ThemedText
        type="smallBold"
        style={
          styles.rowValue
        }
      >
        {value}
      </ThemedText>
    </View>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <View
      style={
        styles.headerRow
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={
          styles.backButton
        }
      >
        <ThemedText
          style={
            styles.backText
          }
        >
          ‹
        </ThemedText>
      </Pressable>

      <View
        style={
          styles.headerTitle
        }
      >
        <ThemedText
          type="subtitle"
          style={
            styles.heading
          }
        >
          Medical Credentials
        </ThemedText>

        <ThemedText
          type="small"
          style={
            styles.headerSub
          }
        >
          Donor Medical Information
        </ThemedText>
      </View>
    </View>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  dateString: string
) {
  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not available';
  }

  return date.toLocaleDateString();
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDocumentType(
  mimeType: string
) {
  if (
    mimeType ===
    'application/pdf'
  ) {
    return 'PDF';
  }

  if (
    mimeType ===
    'image/jpeg'
  ) {
    return 'JPG';
  }

  if (
    mimeType ===
    'image/png'
  ) {
    return 'PNG';
  }

  return 'Document';
}

function getDocumentIcon(
  mimeType: string
) {
  if (
    mimeType ===
    'application/pdf'
  ) {
    return 'PDF';
  }

  if (
    mimeType ===
      'image/jpeg' ||
    mimeType ===
      'image/png'
  ) {
    return 'IMG';
  }

  return 'DOC';
}

function getMimeTypeFromExtension(
  extension: string
) {
  switch (
    extension.toLowerCase()
  ) {
    case 'pdf':
      return 'application/pdf';

    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';

    case 'png':
      return 'image/png';

    default:
      return 'application/octet-stream';
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    safeArea: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        Spacing.three,
      paddingTop:
        Spacing.two,
      paddingBottom: 100,
      gap: Spacing.three,
    },

    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent:
        'center',
    },

    headerRow: {
      alignItems: 'center',
      flexDirection:
        'row',
    },

    backButton: {
      alignItems: 'center',
      height: 40,
      justifyContent:
        'center',
      width: 36,
    },

    backText: {
      color:
        colors.text,
      fontSize: 30,
      lineHeight: 32,
    },

    headerTitle: {
      flex: 1,
      marginLeft:
        Spacing.one,
    },

    heading: {
      color:
        colors.red,
      fontSize: 21,
    },

    headerSub: {
      color:
        colors.blue,
      fontSize: 12,
    },

    section: {
      backgroundColor:
        colors.card,
      borderColor:
        colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding:
        Spacing.three,
    },

    sectionTitle: {
      color:
        colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom:
        Spacing.two,
    },

    infoRow: {
      alignItems: 'center',
      borderBottomColor:
        '#EEF0F5',
      borderBottomWidth: 1,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      minHeight: 48,
      paddingVertical: 8,
    },

    rowLabel: {
      color:
        colors.muted,
      flex: 1,
    },

    rowValue: {
      color:
        colors.text,
      flex: 1,
      textAlign:
        'right',
    },

    fieldContainer: {
      marginBottom:
        Spacing.two,
    },

    fieldLabel: {
      color:
        colors.text,
      marginBottom: 6,
    },

    input: {
      backgroundColor:
        '#F8F9FC',
      borderColor:
        colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color:
        colors.text,
      minHeight: 48,
      paddingHorizontal: 12,
    },

    multilineInput: {
      minHeight: 90,
      paddingTop: 12,
    },

    switchRow: {
      alignItems: 'center',
      borderBottomColor:
        '#EEF0F5',
      borderBottomWidth: 1,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      minHeight: 70,
      paddingVertical: 8,
    },

    switchText: {
      flex: 1,
      paddingRight: 12,
    },

    switchLabel: {
      color:
        colors.text,
    },

    switchDescription: {
      color:
        colors.muted,
      lineHeight: 18,
      marginTop: 3,
    },

    warningBox: {
      borderLeftWidth: 4,
      borderRadius: 10,
      marginTop: 8,
      marginBottom: 8,
      padding: 12,
    },

    warningMessage: {
      lineHeight: 20,
      marginTop: 4,
    },

    infoNote: {
      backgroundColor:
        '#F0F7FA',
      borderRadius: 10,
      marginTop: 8,
      padding: 12,
    },

    infoNoteText: {
      color:
        colors.blue,
      lineHeight: 19,
    },

    primaryButton: {
      alignItems: 'center',
      backgroundColor:
        colors.blue,
      borderRadius: 12,
      flex: 1,
      justifyContent:
        'center',
      minHeight: 52,
      paddingHorizontal: 18,
    },

    primaryButtonText: {
      color:
        '#FFFFFF',
      textAlign:
        'center',
    },

    actionRow: {
      flexDirection:
        'row',
      gap: Spacing.two,
    },

    cancelButton: {
      alignItems: 'center',
      borderColor:
        colors.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent:
        'center',
      minHeight: 52,
      paddingHorizontal: 20,
    },

    cancelText: {
      color:
        colors.muted,
    },

    disabledButton: {
      opacity: 0.6,
    },

    successBox: {
      backgroundColor:
        colors.greenSoft,
      borderRadius: 12,
      padding:
        Spacing.three,
    },

    successText: {
      color:
        colors.green,
    },

    errorBox: {
      backgroundColor:
        colors.redSoft,
      borderRadius: 12,
      padding:
        Spacing.three,
    },

    errorText: {
      color:
        colors.red,
    },

    documentDescription: {
      color:
        colors.muted,
      lineHeight: 19,
    },

    documentInfoBox: {
      backgroundColor:
        colors.blueSoft,
      borderRadius: 10,
      marginTop:
        Spacing.two,
      padding: 12,
    },

    documentInfoText: {
      color:
        colors.blue,
      lineHeight: 18,
    },

    documentMessage: {
      backgroundColor:
        colors.greenSoft,
      borderRadius: 10,
      marginTop:
        Spacing.two,
      padding: 12,
    },

    documentMessageText: {
      color:
        colors.green,
    },

    documentButton: {
      alignItems: 'center',
      borderColor:
        colors.blue,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection:
        'row',
      gap: 8,
      justifyContent:
        'center',
      marginTop:
        Spacing.three,
      minHeight: 48,
      paddingHorizontal: 18,
    },

    disabledDocumentButton: {
      opacity: 0.6,
    },

    documentButtonText: {
      color:
        colors.blue,
      textAlign:
        'center',
    },

    documentEmpty: {
      alignItems:
        'center',
      paddingVertical:
        Spacing.three,
    },

    documentTitle: {
      color:
        colors.text,
      marginBottom: 6,
    },

    documentList: {
      gap: Spacing.two,
      marginTop:
        Spacing.three,
    },

    documentItem: {
      alignItems: 'center',
      backgroundColor:
        '#F8F9FC',
      borderColor:
        colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection:
        'row',
      padding: 12,
    },

    documentIcon: {
      alignItems: 'center',
      backgroundColor:
        colors.blueSoft,
      borderRadius: 10,
      height: 48,
      justifyContent:
        'center',
      marginRight: 10,
      width: 48,
    },

    documentIconText: {
      color:
        colors.blue,
      fontSize: 10,
    },

    documentInfo: {
      flex: 1,
      paddingRight: 8,
    },

    documentName: {
      color:
        colors.text,
    },

    documentMeta: {
      color:
        colors.muted,
      marginTop: 4,
    },

    deleteDocumentButton: {
      alignItems: 'center',
      borderColor:
        colors.red,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent:
        'center',
      minWidth: 58,
      minHeight: 38,
      paddingHorizontal: 8,
    },

    deleteDocumentText: {
      color:
        colors.red,
    },

    disabledDeleteButton: {
      opacity: 0.5,
    },
  });
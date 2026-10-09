import { Platform } from 'react-native';

import api, { type Donor } from '@/lib/api';

export type DonorEligibility = {
  ageWeightOk: boolean;
  donationIntervalOk: boolean;
  medicalSafetyOk: boolean;
};

export type DonorProfile = Donor & {
  nic?: string;

  age?: number;
  weightKg?: number;
  heightCm?: number;
  lastDonationAt?: string;

  bloodPressure?: string;
  hemoglobin?: number;

  diabetes?: boolean;
  highBloodPressure?: boolean;
  heartDisease?: boolean;

  otherMedicalConditions?: string;
  previousSurgeries?: string;

  currentlySick?: boolean;

  takingMedication?: boolean;
  medicationDetails?: string;

  allergies?: string;

  recentDonationComplications?: string;

  eligibility?: DonorEligibility;

  emergencyAlerts?: boolean;
  travelRadiusKm?: number;
};

export type DonorInput = {
  name: string;
  bloodGroup: string;
  phone: string;
  city: string;

  nic?: string;
  password: string;

  available?: boolean;

  age?: number;
  weightKg?: number;
  heightCm?: number;
  lastDonationAt?: string;

  bloodPressure?: string;
  hemoglobin?: number;

  diabetes?: boolean;
  highBloodPressure?: boolean;
  heartDisease?: boolean;

  otherMedicalConditions?: string;
  previousSurgeries?: string;

  currentlySick?: boolean;

  takingMedication?: boolean;
  medicationDetails?: string;

  allergies?: string;

  recentDonationComplications?: string;

  eligibility?: DonorEligibility;

  emergencyAlerts?: boolean;
  travelRadiusKm?: number;
};

export type LoginResponse = {
  token: string;
  donor: {
    _id: string;
  };
};

export type MedicalDocument = {
  _id: string;
  donor: string;

  originalName: string;
  fileName: string;
  filePath: string;

  mimeType: string;
  size: number;

  createdAt?: string;
  updatedAt?: string;
};

export const donorManagementApi = {
  create: (payload: DonorInput) =>
    api
      .post<DonorProfile>(
        '/donors',
        payload
      )
      .then(
        (response) =>
          response.data
      ),

  get: (donorId: string) =>
    api
      .get<DonorProfile>(
        `/donors/${donorId}`
      )
      .then(
        (response) =>
          response.data
      ),

  update: (
    donorId: string,
    payload: Partial<DonorInput>
  ) =>
    api
      .put<DonorProfile>(
        `/donors/${donorId}`,
        payload
      )
      .then(
        (response) =>
          response.data
      ),

  remove: (donorId: string) =>
    api.delete(
      `/donors/${donorId}`
    ),

  login: async (
    nic: string,
    password: string
  ): Promise<LoginResponse> => {
    const { data } =
      await api.post(
        '/auth/login',
        {
          nic,
          password,
        }
      );

    return data as LoginResponse;
  },
};

export const medicalDocumentApi = {
  list: async (
    donorId: string
  ): Promise<MedicalDocument[]> => {
    const response =
      await api.get<MedicalDocument[]>(
        `/medical-documents/${donorId}`
      );

    return response.data;
  },

  upload: async (
    donorId: string,
    file: {
      uri: string;
      name: string;
      mimeType: string;
      webFile?: File;
    }
  ): Promise<MedicalDocument> => {
    /*
     * =====================================================
     * WEB UPLOAD
     * =====================================================
     *
     * Do NOT use Axios here.
     *
     * The Axios instance has a global
     * Content-Type: application/json header.
     *
     * Browser fetch() automatically creates:
     *
     * multipart/form-data;
     * boundary=....
     *
     * which Multer needs.
     */
    if (Platform.OS === 'web') {
      if (!file.webFile) {
        throw new Error(
          'Could not access the selected file.'
        );
      }

      const formData =
        new FormData();

      formData.append(
        'document',
        file.webFile,
        file.name
      );

      const apiBaseUrl =
        process.env
          .EXPO_PUBLIC_API_URL;

      if (!apiBaseUrl) {
        throw new Error(
          'EXPO_PUBLIC_API_URL is not configured.'
        );
      }

      const response =
        await fetch(
          `${apiBaseUrl}/medical-documents/${donorId}`,
          {
            method: 'POST',

            /*
             * IMPORTANT:
             * Do NOT manually set Content-Type.
             *
             * The browser adds the multipart
             * boundary automatically.
             */
            body: formData,
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Upload failed (${response.status}).`
        );
      }

      return data as MedicalDocument;
    }

    /*
     * =====================================================
     * ANDROID / IOS UPLOAD
     * =====================================================
     */
    const formData =
      new FormData();

    formData.append(
      'document',
      {
        uri: file.uri,
        name: file.name,
        type:
          file.mimeType ||
          'application/octet-stream',
      } as any
    );

    const response =
      await api.post<MedicalDocument>(
        `/medical-documents/${donorId}`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

    return response.data;
  },

  remove: async (
    donorId: string,
    documentId: string
  ) => {
    return api.delete(
      `/medical-documents/${donorId}/${documentId}`
    );
  },
};
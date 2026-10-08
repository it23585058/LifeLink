import api, { type Donor } from '@/lib/api';

// Member 1 (Donor Management) - API calls.
// Reuses Atheek's axios instance from api.ts, so api.ts stays untouched.

export type DonorEligibility = {
  ageWeightOk: boolean;
  donationIntervalOk: boolean;
  medicalSafetyOk: boolean;
};

export type DonorProfile = Donor & {
  nic?: string;
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
  available?: boolean;
  eligibility?: DonorEligibility;
  emergencyAlerts?: boolean;
  travelRadiusKm?: number;
};

export const donorManagementApi = {
  create: (payload: DonorInput) =>
    api.post<DonorProfile>('/donors', payload).then((response) => response.data),
  get: (donorId: string) =>
    api.get<DonorProfile>(`/donors/${donorId}`).then((response) => response.data),
  update: (donorId: string, payload: Partial<DonorInput>) =>
    api.put<DonorProfile>(`/donors/${donorId}`, payload).then((response) => response.data),
  remove: (donorId: string) => api.delete(`/donors/${donorId}`),
};
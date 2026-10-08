import axios from 'axios';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not configured.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type Donor = {
  _id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  city: string;
  available: boolean;
  lastDonationAt?: string;
  password: string
};

export type BloodRequest = {
  _id: string;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  city: string;
  unitsNeeded: number;
  urgency: 'routine' | 'urgent' | 'critical';
  status: 'open' | 'fulfilled' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DonorResponse = {
  _id: string;
  request: string;
  donor: string | Donor;
  status: 'offered' | 'accepted' | 'declined' | 'completed';
  message?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiHealth = {
  status: 'ok' | 'degraded';
  database: string;
};

export const apiHealth = () => api.get<ApiHealth>('/health').then((response) => response.data);

export const donorApi = {
  list: (params?: { bloodGroup?: string; city?: string; available?: boolean }) =>
    api.get<Donor[]>('/donors', { params }).then((response) => response.data),
};

export const bloodRequestApi = {
  list: (params?: { bloodGroup?: string; city?: string; status?: BloodRequest['status'] }) =>
    api.get<BloodRequest[]>('/blood-requests', { params }).then((response) => response.data),
  createResponse: (
    requestId: string,
    payload: { donor: string; status: DonorResponse['status']; message?: string }
  ) => api.post<DonorResponse>(`/blood-requests/${requestId}/responses`, payload).then((response) => response.data),
  listResponses: (requestId: string) =>
    api.get<DonorResponse[]>(`/blood-requests/${requestId}/responses`).then((response) => response.data),
  updateResponse: (
    requestId: string,
    responseId: string,
    payload: Partial<Pick<DonorResponse, 'status' | 'message'>>
  ) => api.put<DonorResponse>(`/blood-requests/${requestId}/responses/${responseId}`, payload).then((response) => response.data),
  deleteResponse: (requestId: string, responseId: string) =>
    api.delete(`/blood-requests/${requestId}/responses/${responseId}`),
};

export default api;
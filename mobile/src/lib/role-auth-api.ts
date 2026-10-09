import api from '@/lib/api';

export type Recipient = {
  _id: string;
  name: string;
  phone: string;
  city: string;
  email: string;
};

export type HospitalStaff = {
  _id: string;
  name: string;
  email: string;
  hospital: string;
  role: 'hospital_staff';
};

export const roleAuthApi = {
  registerRecipient: (payload: { name: string; phone: string; city: string; email: string; password: string }) =>
    api.post<{ token: string; recipient: Recipient }>('/auth/recipients/register', payload).then((response) => response.data),
  loginRecipient: (email: string, password: string) =>
    api.post<{ token: string; recipient: Recipient }>('/auth/recipients/login', { email, password }).then((response) => response.data),
  loginHospital: (email: string, password: string) =>
    api.post<{ token: string; staff: HospitalStaff }>('/auth/hospital/login', { email, password }).then((response) => response.data),
  getRecipientProfile: () =>
    api.get<Recipient>('/auth/recipients/me').then((response) => response.data),
  updateRecipientProfile: (payload: Partial<Pick<Recipient, 'name' | 'phone' | 'city'>>) =>
    api.put<Recipient>('/auth/recipients/me', payload).then((response) => response.data),
};

import api from './api';
import { getDemoSession } from './demoSession';

export type StockStatus = 'out' | 'low' | 'available';

export type BloodComponent = 'whole_blood' | 'platelets' | 'ffp';

export type StockItem = {
  _id: string;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
  lowThreshold?: number;
  status: StockStatus;
  updatedAt?: string;
};

export type TransferEvent = {
  label: string;
  kind?: string;
  by?: string;
  at: string;
};

export type Transfer = {
  _id: string;
  caseCode: string;
  hospital:
    | string
    | {
        _id: string;
        name: string;
        city: string;
        address?: string;
        phone?: string;
        wardExtension?: string;
        accreditation?: string;
      };
  ward?: string;
  attendingStaff?: string;
  request?: string;
  donorName: string;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
  transitMode: string;
  vehicleInfo?: string;
  etaMinutes: number;
  status:
    | 'dispatched'
    | 'arrived_at_gate'
    | 'triage_crossmatch'
    | 'completed'
    | 'cancelled';
  events: TransferEvent[];
  createdAt?: string;
  updatedAt?: string;
};

export type Hospital = {
  _id: string;
  name: string;
  type: 'hospital' | 'blood_bank' | 'ngo_camp';
  city: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  accreditation: 'nbts_accredited' | 'hospital_verified' | 'unverified';
  phone: string;
  wardExtension?: string;
  portalUrl?: string;
  stock: StockItem[];
  totalUnits: number;
  lastUpdatedAt?: string;
  distanceKm?: number | null;
  activeTransfers?: Transfer[];
  createdAt?: string;
  updatedAt?: string;
};

export type HospitalSummary = {
  facilities: number;
  totalUnits: number;
  criticalShortages: {
    bloodGroup: string;
    totalUnits: number;
  }[];
};

export type Reservation = {
  _id: string;
  hospital:
    | string
    | {
        _id: string;
        name: string;
        city: string;
        address?: string;
        phone?: string;
        accreditation?: string;
      };
  bloodGroup: string;
  component: BloodComponent;
  units: number;
  reservedBy: string;
  status: 'pending' | 'collected' | 'cancelled';
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

function getAuthHeaders() {
  const session = getDemoSession();
  return {
    'x-demo-role': session.role,
    'x-demo-user': session.userId,
  };
}

export const hospitalApi = {
  list: (params?: {
    type?: string;
    city?: string;
    bloodGroup?: string;
    q?: string;
    lat?: number;
    lng?: number;
    sort?: 'distance' | 'name';
  }) =>
    api
      .get<Hospital[]>('/hospitals', {
        params,
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  summary: () =>
    api
      .get<HospitalSummary>('/hospitals/summary', {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get<Hospital>(`/hospitals/${id}`, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),
};

export const inventoryApi = {
  list: (hospitalId?: string) =>
    api
      .get<StockItem[]>('/blood-inventory', {
        params: hospitalId ? { hospital: hospitalId } : undefined,
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  create: (payload: {
    hospital: string;
    bloodGroup: string;
    component?: BloodComponent;
    units: number;
    lowThreshold?: number;
  }) =>
    api
      .post<StockItem>('/blood-inventory', payload, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  update: (
    id: string,
    payload: {
      units?: number;
      lowThreshold?: number;
    }
  ) =>
    api
      .put<StockItem>(`/blood-inventory/${id}`, payload, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/blood-inventory/${id}`, {
      headers: getAuthHeaders(),
    }),
};

export const reservationApi = {
  create: (payload: {
    hospital: string;
    bloodGroup: string;
    component?: BloodComponent;
    units: number;
    note?: string;
  }) =>
    api
      .post<Reservation>('/reservations', payload, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  list: (params?: {
    reservedBy?: string;
    hospital?: string;
    status?: string;
  }) =>
    api
      .get<Reservation[]>('/reservations', {
        params,
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  updateStatus: (id: string, status: 'cancelled' | 'collected') =>
    api
      .put<Reservation>(
        `/reservations/${id}`,
        { status },
        {
          headers: getAuthHeaders(),
        }
      )
      .then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/reservations/${id}`, {
      headers: getAuthHeaders(),
    }),
};

export const transferApi = {
  create: (payload: {
    hospital: string;
    ward?: string;
    attendingStaff?: string;
    donorName: string;
    bloodGroup: string;
    component?: BloodComponent;
    units?: number;
    transitMode?: string;
    vehicleInfo?: string;
    etaMinutes: number;
  }) =>
    api
      .post<Transfer>('/transfers', payload, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  list: (params?: { hospital?: string; status?: string }) =>
    api
      .get<Transfer[]>('/transfers', {
        params,
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  getById: (id: string) =>
    api
      .get<Transfer>(`/transfers/${id}`, {
        headers: getAuthHeaders(),
      })
      .then((res) => res.data),

  updateStatus: (
    id: string,
    status: 'arrived_at_gate' | 'triage_crossmatch' | 'completed' | 'cancelled',
    note?: string
  ) =>
    api
      .put<Transfer>(
        `/transfers/${id}/status`,
        { status, note },
        {
          headers: getAuthHeaders(),
        }
      )
      .then((res) => res.data),

  updateEta: (id: string, etaMinutes: number, note?: string) =>
    api
      .put<Transfer>(
        `/transfers/${id}`,
        { etaMinutes, note },
        {
          headers: getAuthHeaders(),
        }
      )
      .then((res) => res.data),

  delete: (id: string) =>
    api.delete(`/transfers/${id}`, {
      headers: getAuthHeaders(),
    }),
};

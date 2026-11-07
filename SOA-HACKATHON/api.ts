import axios from 'axios';
import { Certificate, OwnershipTransfer, RetirementRecord, KafkaEvent, AuditLogEntry, EurekaInstance, ActuatorMetrics, ActuatorHealth, User } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token and X-Correlation-Id
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('soa_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add unique correlation ID for every REST call tracing
  config.headers['X-Correlation-Id'] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return config;
});

export const authApi = {
  login: async (email: string, password: string = 'password') => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData: { username: string; email: string; password?: string; role: string; organization: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { ...userData, password: userData.password || 'password' });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};

export const certificateApi = {
  getAll: async (params?: { search?: string; owner?: string; status?: string; energySource?: string }) => {
    const res = await api.get<{ content: Certificate[]; totalElements: number }>('/certificates', { params });
    return res.data.content;
  },
  getBySerial: async (serialNumber: string) => {
    const res = await api.get<Certificate>(`/certificates/${encodeURIComponent(serialNumber)}`);
    return res.data;
  },
  issue: async (cert: {
    serialNumber: string;
    energySource: string;
    energyQuantityMWh: number;
    currentOwnerOrganization: string;
    facilityName?: string;
    gridRegion?: string;
    issueDate?: string;
  }) => {
    const res = await api.post<Certificate>('/certificates', cert);
    return res.data;
  },
};

export const ownershipApi = {
  getOwnership: async (serialNumber: string) => {
    const res = await api.get<{ serialNumber: string; currentOwner: string; status: string; isEligibleForTransfer: boolean }>(
      `/ownership/${encodeURIComponent(serialNumber)}`
    );
    return res.data;
  },
  getHistory: async (serialNumber: string) => {
    const res = await api.get<OwnershipTransfer[]>(`/ownership/history/${encodeURIComponent(serialNumber)}`);
    return res.data;
  },
  transfer: async (data: { serialNumber: string; newOwnerOrganization: string; notes?: string }) => {
    const res = await api.post<{ message: string; transfer: OwnershipTransfer; certificate: Certificate }>(
      '/ownership/transfer',
      data
    );
    return res.data;
  },
};

export const retirementApi = {
  getAll: async (params?: { serialNumber?: string; organization?: string; search?: string }) => {
    const res = await api.get<{ content: RetirementRecord[]; totalElements: number }>('/retirements', { params });
    return res.data.content;
  },
  getBySerial: async (serialNumber: string) => {
    const res = await api.get<RetirementRecord>(`/retirements/${encodeURIComponent(serialNumber)}`);
    return res.data;
  },
  retire: async (data: {
    serialNumber: string;
    claimReference: string;
    claimantOrganization: string;
    purpose?: string;
  }) => {
    const res = await api.post<{
      message: string;
      retirement: RetirementRecord;
      certificate: Certificate;
      kafkaEvent: any;
    }>('/retirements', data);
    return res.data;
  },
};

export const kafkaApi = {
  getEvents: async () => {
    const res = await api.get<{
      topic: string;
      partitions: number;
      events: KafkaEvent[];
      processedEventCount: number;
    }>('/kafka/events');
    return res.data;
  },
  simulateDuplicate: async (eventId: string) => {
    const res = await api.post('/kafka/simulate-duplicate', { eventId });
    return res.data;
  },
  simulateDlq: async () => {
    const res = await api.post('/kafka/simulate-dlq');
    return res.data;
  },
};

export const eurekaApi = {
  getInstances: async () => {
    const res = await api.get<{
      eurekaServer: any;
      instances: EurekaInstance[];
    }>('/eureka/instances');
    return res.data;
  },
  toggleInstance: async (instanceId: string) => {
    const res = await api.post<{ message: string; instance: EurekaInstance; healthyInstancesRemaining: number }>(
      '/eureka/instances/toggle',
      { instanceId }
    );
    return res.data;
  },
};

export const systemApi = {
  getAuditLogs: async () => {
    const res = await api.get<AuditLogEntry[]>('/audit');
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get<ActuatorHealth>('/actuator/health');
    return res.data;
  },
  getMetrics: async () => {
    const res = await api.get<ActuatorMetrics>('/actuator/metrics');
    return res.data;
  },
  runConcurrencyLoadTest: async (serialNumber: string, totalRequests: number = 20) => {
    const res = await api.post('/load-test/concurrent-retirements', { serialNumber, totalRequests });
    return res.data;
  },
};

export default api;

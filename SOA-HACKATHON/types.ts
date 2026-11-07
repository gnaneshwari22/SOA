export type EnergySource = 'Solar' | 'Wind' | 'Hydro' | 'Geothermal' | 'Biomass';
export type CertificateStatus = 'ACTIVE' | 'RETIRED';
export type UserRole = 'certificateOwner' | 'registryOfficer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization: string;
}

export interface Certificate {
  id: string;
  serialNumber: string;
  energySource: EnergySource;
  energyQuantityMWh: number;
  issuingOrganization: string;
  currentOwnerOrganization: string;
  issueDate: string;
  status: CertificateStatus;
  facilityName: string;
  gridRegion: string;
  createdAt: string;
}

export interface OwnershipTransfer {
  id: string;
  serialNumber: string;
  previousOwner: string;
  newOwner: string;
  transferredAt: string;
  transferredBy: string;
  notes: string;
}

export interface RetirementRecord {
  id: string;
  serialNumber: string;
  claimReference: string;
  claimantOrganization: string;
  retirementTimestamp: string;
  retiredBy: string;
  purpose: string;
  energyQuantityMWh: number;
  energySource: EnergySource;
  verificationHash: string;
}

export interface KafkaEvent {
  eventId: string;
  aggregateId: string;
  schemaVersion: string;
  occurredAt: string;
  correlationId: string;
  eventType: string;
  topic: string;
  partition: number;
  offset: number;
  payload: {
    serialNumber: string;
    claimReference?: string;
    claimantOrganization?: string;
    energyQuantityMWh?: number;
    energySource?: string;
    retirementTimestamp?: string;
    retiredBy?: string;
    [key: string]: any;
  };
  status: 'PUBLISHED' | 'CONSUMED' | 'DUPLICATE_IGNORED' | 'DEAD_LETTER';
  dlqReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  correlationId: string;
  action: 'USER_LOGIN' | 'CERTIFICATE_ISSUED' | 'OWNERSHIP_TRANSFERRED' | 'CERTIFICATE_RETIRED' | 'RETIREMENT_REJECTED' | 'SECURITY_REJECTION' | 'EVENT_CONSUMED';
  actor: string;
  organization: string;
  resourceId: string;
  status: 'SUCCESS' | 'REJECTED' | 'FAILED';
  details: string;
}

export interface EurekaInstance {
  serviceName: string;
  instanceId: string;
  port: number;
  status: 'UP' | 'DOWN';
  lastHeartbeat: string;
}

export interface ActuatorHealth {
  status: string;
  components: Record<string, any>;
}

export interface ActuatorMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: string;
  averageLatencyMs: number;
  jvmMemoryUsedMB: number;
  jvmMemoryMaxMB: number;
  activeThreads: number;
  kafkaLag: number;
}

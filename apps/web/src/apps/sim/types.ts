export type SIMStatus = 'inactive' | 'active' | 'suspended' | 'deactivated';
export type SIMType = 'physical' | 'esim';
export type SimTab = 'home' | 'numbers' | 'sim' | 'call' | 'sms' | 'network' | 'security' | 'notifications' | 'admin';

export interface SimDashboard {
  phoneNumber?: string;
  carrier: { name: string; code: string } | null;
  simStatus: SIMStatus;
  subscription: string;
  simType: SIMType;
  simSerial: string;
  signalStrength: string;
  signalBars: number;
  networkMode: string;
  internetStatus: boolean;
  roaming: boolean;
  wifiCalling: boolean;
  coverage: string;
  simProfile: SIMProfile;
}

export interface SIMProfile {
  id: string;
  userId: string;
  phoneNumber?: string;
  phoneNumberId: string;
  carrier: { name: string; code: string };
  simType: SIMType;
  simSerial: string;
  status: SIMStatus;
  isPrimary: boolean;
  slot: string;
  subscriptionPlan: string;
  activatedAt?: string;
}

export interface PhoneNumberData {
  id: string;
  number: string;
  type: string;
  status: string;
  isFavorite: boolean;
  assignedAt?: string;
}

export interface CallSettingsData {
  callerIdEnabled: boolean;
  callWaiting: boolean;
  callForwarding: boolean;
  callForwardingNumber?: string;
  voicemailEnabled: boolean;
  spamProtection: boolean;
  unknownCallFilter: boolean;
  emergencyNumbers: string[];
}

export interface SMSSettingsData {
  messageCenter: string;
  deliveryReports: boolean;
  readReports: boolean;
  spamFilter: boolean;
  backupEnabled: boolean;
  lastBackupAt?: string;
}

export interface NetworkData {
  networkMode: string;
  wifiCalling: boolean;
  roaming: boolean;
  internetStatus: boolean;
  signalStrength: string;
  signalBars: number;
  coverage: string;
  carrier: { name: string; code: string } | null;
  lastDiagnosticAt?: string;
}

export interface SimNotification {
  id: string;
  title: string;
  body: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalSims: number;
  activeSims: number;
  suspendedSims: number;
  totalNumbers: number;
  assignedNumbers: number;
  availableNumbers: number;
}

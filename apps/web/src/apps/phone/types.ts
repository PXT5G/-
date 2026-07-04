export type PhoneTab =
  | 'dashboard'
  | 'dialpad'
  | 'recents'
  | 'favorites'
  | 'contacts'
  | 'voicemail'
  | 'blocked'
  | 'settings'
  | 'incoming'
  | 'active';

export interface PhoneDashboard {
  phoneNumber: string | null;
  simActive: boolean;
  settings: PhoneSettings;
  activeCall: { id: string; callId: string; state: string; displayName: string } | null;
  missedCalls: number;
  unreadVoicemail: number;
  favoritesCount: number;
  recentCount: number;
}

export interface PhoneSettings {
  callerIdEnabled: boolean;
  showMyNumber: boolean;
  autoRejectUnknown: boolean;
  silenceUnknownCallers: boolean;
  callWaiting: boolean;
  callForwardingEnabled: boolean;
  callForwardingNumber?: string;
  voicemailEnabled: boolean;
  voicemailGreeting?: string;
  recordCalls: boolean;
  hapticFeedback: boolean;
  dynamicIslandEnabled: boolean;
}

export interface PhoneFavorite {
  id: string;
  contactId?: string;
  phoneNumber: string;
  label: string;
  position: number;
  avatar?: string;
}

export interface PhoneBlocked {
  id: string;
  phoneNumber: string;
  label?: string;
  reason?: string;
  blockType: 'call' | 'sms' | 'both';
  createdAt: string;
}

export interface CallHistoryEntry {
  id: string;
  callId: string;
  displayName: string;
  phoneNumber: string;
  remoteNumber: string;
  contactId?: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  isEmergency: boolean;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
}

export interface ActiveCallState {
  id: string;
  callId: string;
  phoneNumber: string;
  remoteNumber: string;
  remoteUserId?: string;
  contactId?: string;
  displayName: string;
  direction: 'incoming' | 'outgoing';
  state: string;
  isEmergency: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
  isOnHold: boolean;
  isConference: boolean;
  startedAt: string;
  connectedAt?: string;
  avatar?: string;
}

export interface VoicemailEntry {
  id: string;
  fromNumber: string;
  fromName: string;
  contactId?: string;
  durationSeconds: number;
  transcript?: string;
  isRead: boolean;
  isUrgent: boolean;
  receivedAt: string;
}

export interface EmergencyContact {
  id: string;
  contactId?: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  priority: number;
}

export interface ContactSearchResult {
  id: string;
  fullName: string;
  primaryPhone?: string;
  avatar?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
}

export interface IncomingCallPayload {
  callId: string;
  phoneNumber?: string;
  remoteNumber: string;
  displayName: string;
  direction: 'incoming' | 'outgoing';
  isEmergency?: boolean;
  avatar?: string;
}

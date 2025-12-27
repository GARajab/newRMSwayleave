
export type UserRole = 'PLANNING' | 'TSS' | 'EDD' | 'Admin' | 'Unassigned';

export const ALL_USER_ROLES: UserRole[] = ['PLANNING', 'TSS', 'EDD', 'Admin', 'Unassigned'];

export type WayleaveStatus = 'Waiting for TSS Action' | 'Sent to MOW' | 'Sent to Planning (EDD)' | 'Completed';

export interface HistoryEntry {
  status: WayleaveStatus;
  timestamp: Date;
  actor: UserRole;
}

export interface AttachmentInfo {
  name: string;
  size: number;
  path: string;
}

export interface WayleaveRecord {
  id: number;
  wayleaveNumber: string;
  status: WayleaveStatus;
  attachment: AttachmentInfo;
  approvedAttachment?: AttachmentInfo;
  history: HistoryEntry[];
}

export interface UserProfile {
  id: string; // user uuid
  email: string;
  role: UserRole;
  status: 'active' | 'pending';
}

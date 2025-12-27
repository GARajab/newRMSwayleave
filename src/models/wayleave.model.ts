
export type UserRole = 'PLANNING' | 'TSS' | 'EDD';

export const ALL_USER_ROLES: UserRole[] = ['PLANNING', 'TSS', 'EDD'];

export type WayleaveStatus = 'Waiting for TSS Action' | 'Sent to MOW' | 'Sent to Planning (EDD)' | 'Completed';

export interface HistoryEntry {
  status: WayleaveStatus;
  timestamp: Date;
  actor: UserRole;
}

export interface AttachmentInfo {
  name: string;
  size: number;
  file?: File;
}

export interface WayleaveRecord {
  id: number;
  wayleaveNumber: string;
  status: WayleaveStatus;
  attachment: AttachmentInfo;
  approvedAttachment?: AttachmentInfo;
  history: HistoryEntry[];
}

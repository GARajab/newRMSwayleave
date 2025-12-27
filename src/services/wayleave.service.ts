
import { Injectable, signal } from '@angular/core';
import { WayleaveRecord, WayleaveStatus, UserRole } from '../models/wayleave.model';

@Injectable({ providedIn: 'root' })
export class WayleaveService {
  private nextId = signal(4);
  
  currentUser = signal<UserRole>('PLANNING');

  records = signal<WayleaveRecord[]>([]);

  private createDummyFile(name: string): File {
    return new File([`This is a dummy PDF for ${name}`], name, { type: 'application/pdf' });
  }

  initializeData(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const initialRecords: WayleaveRecord[] = [
          {
            id: 1,
            wayleaveNumber: 'WL-2024-001',
            status: 'Waiting for TSS Action',
            attachment: { name: 'site_plan_001.pdf', size: 120450, file: this.createDummyFile('site_plan_001.pdf') },
            history: [
              { status: 'Waiting for TSS Action', timestamp: new Date('2024-07-20T10:00:00Z'), actor: 'PLANNING' }
            ]
          },
          {
            id: 2,
            wayleaveNumber: 'WL-2024-002',
            status: 'Sent to MOW',
            attachment: { name: 'application_form_002.pdf', size: 250600, file: this.createDummyFile('application_form_002.pdf') },
            history: [
              { status: 'Waiting for TSS Action', timestamp: new Date('2024-07-19T11:30:00Z'), actor: 'PLANNING' },
              { status: 'Sent to MOW', timestamp: new Date('2024-07-21T09:15:00Z'), actor: 'TSS' }
            ]
          },
          {
            id: 3,
            wayleaveNumber: 'WL-2024-003',
            status: 'Sent to Planning (EDD)',
            attachment: { name: 'initial_submission_003.pdf', size: 450000, file: this.createDummyFile('initial_submission_003.pdf') },
            approvedAttachment: { name: 'mow_approved_docs_003.pdf', size: 500123, file: this.createDummyFile('mow_approved_docs_003.pdf') },
            history: [
              { status: 'Waiting for TSS Action', timestamp: new Date('2024-07-18T14:00:00Z'), actor: 'PLANNING' },
              { status: 'Sent to MOW', timestamp: new Date('2024-07-20T16:05:00Z'), actor: 'TSS' },
              { status: 'Sent to Planning (EDD)', timestamp: new Date('2022-07-22T11:45:00Z'), actor: 'TSS' }
            ]
          }
        ];
        this.records.set(initialRecords);
        resolve();
      }, 1500); // Simulate 1.5 second network delay for initial load
    });
  }

  addRecord(wayleaveNumber: string, attachment: File): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const newRecord: WayleaveRecord = {
          id: this.nextId(),
          wayleaveNumber,
          status: 'Waiting for TSS Action',
          attachment: {
            name: attachment.name,
            size: attachment.size,
            file: attachment,
          },
          history: [{
            status: 'Waiting for TSS Action',
            timestamp: new Date(),
            actor: 'PLANNING'
          }]
        };
        this.records.update(records => [...records, newRecord]);
        this.nextId.update(id => id + 1);
        resolve();
      }, 1000); // Simulate 1 second network delay
    });
  }

  updateStatus(recordId: number, newStatus: WayleaveStatus, actor: UserRole, approvedAttachmentFile?: File): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.records.update(records => 
          records.map(record => {
            if (record.id === recordId) {
              const updatedRecord: WayleaveRecord = {
                ...record,
                status: newStatus,
                history: [...record.history, { status: newStatus, timestamp: new Date(), actor }]
              };

              if (approvedAttachmentFile) {
                updatedRecord.approvedAttachment = {
                  name: approvedAttachmentFile.name,
                  size: approvedAttachmentFile.size,
                  file: approvedAttachmentFile
                };
              }
              
              return updatedRecord;
            }
            return record;
          })
        );
        resolve();
      }, 1000); // Simulate 1 second network delay
    });
  }
}

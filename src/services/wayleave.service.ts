
import { Injectable, signal, inject, computed } from '@angular/core';
import { WayleaveRecord, WayleaveStatus, UserRole } from '../models/wayleave.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WayleaveService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  currentUser = computed(() => this.authService.currentUserRole());
  records = signal<WayleaveRecord[]>([]);

  constructor() {
    this.supabaseService.listenToChanges(
      // Add new record to the top of the list
      (newRecord) => this.records.update(currentRecords => [newRecord, ...currentRecords]),
      // Update an existing record in place
      (updatedRecord) => this.records.update(currentRecords =>
        currentRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r)
      ),
      // Remove a deleted record
      (deletedId) => this.records.update(currentRecords =>
        currentRecords.filter(r => r.id !== deletedId)
      )
    );
  }

  async initializeData(): Promise<void> {
    const records = await this.supabaseService.getRecords();
    this.records.set(records);
  }

  async addRecord(wayleaveNumber: string, attachment: File): Promise<void> {
    const actor = this.currentUser();
    if (!actor) {
        throw new Error("User is not authenticated or has no role assigned.");
    }
    await this.supabaseService.addRecord(wayleaveNumber, attachment, actor);
  }

  async updateStatus(recordId: number, newStatus: WayleaveStatus, actor: UserRole, approvedAttachmentFile?: File): Promise<void> {
    await this.supabaseService.updateStatus(recordId, newStatus, actor, approvedAttachmentFile);
  }

  async updateRecordDetails(recordId: number, wayleaveNumber: string): Promise<void> {
    await this.supabaseService.updateRecordDetails(recordId, wayleaveNumber);
  }
  
  async deleteRecord(recordId: number): Promise<void> {
    await this.supabaseService.deleteRecord(recordId);
    // Real-time listener will handle removing the record from the signal.
  }

  async getAttachmentDownloadUrl(path: string): Promise<string> {
    return this.supabaseService.getAttachmentUrl(path);
  }
}

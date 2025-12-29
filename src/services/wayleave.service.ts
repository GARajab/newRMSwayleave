
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
  searchTerm = signal('');

  startRealtimeUpdates(): void {
    this.supabaseService.subscribeToChanges(
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

  stopRealtimeUpdates(): void {
    this.supabaseService.unsubscribeFromChanges();
  }

  async initializeData(): Promise<void> {
    // First, verify that all required database components are present.
    const setupStatus = await this.supabaseService.checkSetupStatus();
    if (!setupStatus.is_complete) {
      const missingItems = setupStatus.missing?.join(', ') || 'unknown components';
      // Throw a specific error that the AppComponent can catch to display setup instructions.
      throw new Error(`Database setup is incomplete. Missing: ${missingItems}.`);
    }

    // If setup is complete, proceed to fetch the records.
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

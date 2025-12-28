import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WayleaveService } from '../../services/wayleave.service';
import { WayleaveRecord, WayleaveStatus, AttachmentInfo } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ModalComponent } from '../modal/modal.component';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, SpinnerComponent, ModalComponent, AdminOverviewComponent],
  template: `
<app-admin-overview></app-admin-overview>

<!-- Wayleave Records Table -->
<div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl overflow-hidden ring-1 ring-slate-900/5">
  <div class="overflow-x-auto">
    <table class="min-w-full">
      <thead class="bg-slate-50 dark:bg-slate-700/50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Wayleave #</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attachments</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Update</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200/75 dark:divide-slate-700/50">
        @for (record of records(); track record.id; let i = $index) {
          @let lastHistory = record.history[record.history.length - 1];
          @let styles = statusStyles()[record.status];
          <tr class="animate-fade-in-up hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-150" [style.animation-delay]="i * 50 + 'ms'">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ record.wayleaveNumber }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium" [class]="styles.container">
                <div class="h-2 w-2 rounded-full" [class]="styles.dot"></div>
                <span>{{ record.status }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <div class="flex flex-col gap-2">
                 <button (click)="downloadFile(record.attachment)" [disabled]="isDownloading(record.attachment.path)" title="Download Initial Document" class="flex items-center gap-2 text-left group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>
                    <span class="truncate group-hover:underline" [title]="record.attachment.name">{{ record.attachment.name }}</span>
                 </button>
                 @if (record.approvedAttachment) {
                    <button (click)="downloadFile(record.approvedAttachment)" [disabled]="isDownloading(record.approvedAttachment.path)" title="Download Approved Document" class="flex items-center gap-2 text-left group">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                       <span class="truncate group-hover:underline" [title]="record.approvedAttachment.name">{{ record.approvedAttachment.name }}</span>
                    </button>
                 }
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ lastHistory.timestamp | date:'short' }}</td>
            <td class="px-6 py-4 text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button (click)="openUpdateModal(record)" class="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 transition-all duration-150 hover:underline">Change Status</button>
                    <button (click)="openDeleteModal(record)" class="font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-all duration-150 hover:underline">Delete</button>
                </div>
            </td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No wayleave records found.</td></tr>
        }
      </tbody>
    </table>
  </div>
</div>

<!-- Modals -->
@if (recordToUpdate()) {
  <app-modal title="Change Wayleave Status" (close)="closeUpdateModal()">
    <form (ngSubmit)="handleStatusUpdate()" class="space-y-4">
        <p>Wayleave #<span class="font-bold">{{ recordToUpdate()!.wayleaveNumber }}</span></p>
        <div>
            <label for="status-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
            <select id="status-select" name="newStatus" [(ngModel)]="newStatus" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                @for(status of allStatuses; track status) {
                    <option [value]="status">{{ status }}</option>
                }
            </select>
        </div>
         <div class="flex justify-end space-x-4 pt-4">
            <button type="button" (click)="closeUpdateModal()" [disabled]="isUpdatingStatus()" class="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">Cancel</button>
            <button type="submit" [disabled]="isUpdatingStatus() || newStatus === recordToUpdate()!.status" class="flex justify-center items-center w-28 px-4 py-2 bg-sky-500 text-white rounded-md shadow-sm hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed">
                @if (isUpdatingStatus()) { <app-spinner></app-spinner> } @else { <span>Save</span> }
            </button>
        </div>
    </form>
  </app-modal>
}

@if (recordToDelete()) {
  <app-modal title="Confirm Deletion" (close)="closeDeleteModal()">
    <div class="text-center">
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">Delete wayleave record <span class="font-bold">{{ recordToDelete()!.wayleaveNumber }}</span>?</p>
      <p class="text-sm text-red-600 dark:text-red-400 mb-6">This action is irreversible and will delete all associated attachments.</p>
      <div class="flex justify-center space-x-4">
        <button (click)="closeDeleteModal()" [disabled]="isDeletingRecord()" class="px-6 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button (click)="confirmDeletion()" [disabled]="isDeletingRecord()" class="flex justify-center items-center w-32 px-6 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50">
           @if(isDeletingRecord()) { <app-spinner></app-spinner> } @else { <span>Yes, Delete</span> }
        </button>
      </div>
    </div>
  </app-modal>
}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private wayleaveService = inject(WayleaveService);

  // Wayleave signals
  records = this.wayleaveService.records;
  downloadingPaths = signal<string[]>([]);
  
  // Modals and actions state
  recordToUpdate = signal<WayleaveRecord | null>(null);
  isUpdatingStatus = signal(false);
  newStatus: WayleaveStatus = 'Waiting for TSS Action';
  readonly allStatuses: WayleaveStatus[] = ['Waiting for TSS Action', 'Sent to MOW', 'Sent to Planning (EDD)', 'Completed'];
  
  recordToDelete = signal<WayleaveRecord | null>(null);
  isDeletingRecord = signal(false);

  statusStyles = computed(() => ({
    'Waiting for TSS Action': { container: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
    'Sent to MOW': { container: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    'Sent to Planning (EDD)': { container: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    'Completed': { container: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  }));

  // --- Modal Control ---
  openUpdateModal(record: WayleaveRecord) {
    this.newStatus = record.status;
    this.recordToUpdate.set(record);
  }
  closeUpdateModal() {
    this.recordToUpdate.set(null);
  }
  openDeleteModal(record: WayleaveRecord) { this.recordToDelete.set(record); }
  closeDeleteModal() {
    this.recordToDelete.set(null);
  }

  // --- Actions ---
  async handleStatusUpdate() {
    const record = this.recordToUpdate();
    if (!record || record.status === this.newStatus) return;
    this.isUpdatingStatus.set(true);
    try {
        await this.wayleaveService.updateStatus(record.id, this.newStatus, 'Admin');
        this.closeUpdateModal();
    } catch(e: any) {
        alert(`Error: ${e.message}`);
    } finally {
        this.isUpdatingStatus.set(false);
    }
  }

  async confirmDeletion() {
    const record = this.recordToDelete();
    if (!record) return;
    this.isDeletingRecord.set(true);
    try {
        await this.wayleaveService.deleteRecord(record.id);
        this.closeDeleteModal();
    } catch(e: any) {
        alert(`Error: ${e.message}`);
    } finally {
        this.isDeletingRecord.set(false);
    }
  }

  // --- Utility ---
  async downloadFile(attachment: AttachmentInfo) {
    this.downloadingPaths.update(paths => [...paths, attachment.path]);
    try {
      const url = await this.wayleaveService.getAttachmentDownloadUrl(attachment.path);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      a.click();
    } catch (error: any) {
      alert('Could not download file. Please try again.');
    } finally {
      this.downloadingPaths.update(paths => paths.filter(p => p !== attachment.path));
    }
  }
  isDownloading = (path: string) => this.downloadingPaths().includes(path);
}

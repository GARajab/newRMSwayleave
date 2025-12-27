
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveService } from '../../services/wayleave.service';
import { WayleaveStatus, UserRole, WayleaveRecord, AttachmentInfo } from '../../models/wayleave.model';
import { ModalComponent } from '../modal/modal.component';
import { UpdateStatusFormComponent } from '../update-status-form/update-status-form.component';

@Component({
  selector: 'app-wayleave-list',
  imports: [CommonModule, ModalComponent, UpdateStatusFormComponent],
  template: `
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
          @let availableActions = getActionsForRecord(record.status, currentUser());
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
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex flex-col overflow-hidden">
                      <span class="truncate" [title]="record.attachment.name">{{ record.attachment.name }} ({{ formatFileSize(record.attachment.size) }})</span>
                      <span class="text-xs text-gray-400">Initial Document</span>
                    </div>
                  </div>
                  <button (click)="downloadFile(record.attachment)" [disabled]="isDownloading(record.attachment.path)" title="Download Initial Document" class="ml-2 p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-wait flex-shrink-0 transition-transform hover:scale-110">
                    @if(isDownloading(record.attachment.path)) {
                      <svg class="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    }
                  </button>
                </div>
                @if (record.approvedAttachment) {
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      <div class="flex flex-col overflow-hidden">
                        <span class="truncate" [title]="record.approvedAttachment.name">{{ record.approvedAttachment.name }} ({{ formatFileSize(record.approvedAttachment.size) }})</span>
                        <span class="text-xs text-gray-400">Approved Document (TSS)</span>
                      </div>
                    </div>
                     <button (click)="downloadFile(record.approvedAttachment)" [disabled]="isDownloading(record.approvedAttachment.path)" title="Download Approved Document" class="ml-2 p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-wait flex-shrink-0 transition-transform hover:scale-110">
                       @if(isDownloading(record.approvedAttachment.path)) {
                        <svg class="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>
                  </div>
                }
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ lastHistory.timestamp | date:'short' }}
            </td>
            <td class="px-6 py-4 text-sm font-medium">
              @if (availableActions.length > 0) {
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                  @for(action of availableActions; track action.label) {
                      <button (click)="openUpdateModal(record, action)" class="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 transition-all duration-150 hover:underline">
                        {{ action.label }}
                      </button>
                  }
                </div>
              } @else {
                <span class="text-gray-400 dark:text-gray-500 italic">No actions available</span>
              }
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No wayleave records found.
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>

@if (isUpdateModalOpen() && recordToUpdate() && actionToPerform()) {
  <app-modal [title]="'Update Wayleave Status'" (close)="closeUpdateModal()">
    <app-update-status-form 
      [record]="recordToUpdate()!"
      [action]="actionToPerform()!"
      [isLoading]="isUpdatingStatus()"
      (updateConfirmed)="handleStatusUpdate($event)"
      (updateCancelled)="closeUpdateModal()">
    </app-update-status-form>
  </app-modal>
}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WayleaveListComponent {
  wayleaveService = inject(WayleaveService);
  
  records = this.wayleaveService.records;
  currentUser = this.wayleaveService.currentUser;

  isUpdateModalOpen = signal(false);
  isUpdatingStatus = signal(false);
  recordToUpdate = signal<WayleaveRecord | null>(null);
  actionToPerform = signal<{ label: string, newStatus: WayleaveStatus, actor: UserRole } | null>(null);
  downloadingPaths = signal<string[]>([]);

  statusStyles = computed(() => ({
    'Waiting for TSS Action': {
      container: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-500'
    },
    'Sent to MOW': {
      container: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500'
    },
    'Sent to Planning (EDD)': {
      container: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-500'
    },
    'Completed': {
      container: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
      dot: 'bg-green-500'
    },
  }));

  getActionsForRecord(status: WayleaveStatus, user: UserRole | null) {
    const actions: { label: string, newStatus: WayleaveStatus, actor: UserRole }[] = [];
    if (!user) return actions;

    if (user === 'Admin') {
      const allStatuses: WayleaveStatus[] = ['Waiting for TSS Action', 'Sent to MOW', 'Sent to Planning (EDD)', 'Completed'];
      for (const newStatus of allStatuses) {
        if (status !== newStatus) {
          actions.push({ label: `Admin: Set to ${newStatus}`, newStatus, actor: 'Admin' });
        }
      }
    } else if (user === 'TSS') {
      if (status === 'Waiting for TSS Action') {
        actions.push({ label: 'Send to MOW', newStatus: 'Sent to MOW', actor: 'TSS' });
      } else if (status === 'Sent to MOW') {
        actions.push({ label: 'Send to Planning (EDD)', newStatus: 'Sent to Planning (EDD)', actor: 'TSS' });
      }
    } else if (user === 'EDD' && status === 'Sent to Planning (EDD)') {
      actions.push({ label: 'Mark as Completed', newStatus: 'Completed', actor: 'EDD' });
    }
    
    return actions;
  }

  openUpdateModal(record: WayleaveRecord, action: { label: string, newStatus: WayleaveStatus, actor: UserRole }) {
    this.recordToUpdate.set(record);
    this.actionToPerform.set(action);
    this.isUpdateModalOpen.set(true);
  }

  async handleStatusUpdate(approvedFile: File | null) {
    const record = this.recordToUpdate();
    const action = this.actionToPerform();
    if (record && action) {
      this.isUpdatingStatus.set(true);
      await this.wayleaveService.updateStatus(record.id, action.newStatus, action.actor, approvedFile ?? undefined);
      this.isUpdatingStatus.set(false);
    }
    this.closeUpdateModal();
  }
  
  closeUpdateModal() {
    if (this.isUpdatingStatus()) return;
    this.isUpdateModalOpen.set(false);
    this.recordToUpdate.set(null);
    this.actionToPerform.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async downloadFile(attachment: AttachmentInfo | undefined) {
    if (!attachment) {
      alert('No file available for download.');
      return;
    }
    
    this.downloadingPaths.update(paths => [...paths, attachment.path]);
    
    try {
      const url = await this.wayleaveService.getAttachmentDownloadUrl(attachment.path);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to get download URL', error.message, error);
      alert('Could not download file. Please try again.');
    } finally {
      this.downloadingPaths.update(paths => paths.filter(p => p !== attachment.path));
    }
  }

  isDownloading(path: string | undefined): boolean {
    if (!path) return false;
    return this.downloadingPaths().includes(path);
  }
}

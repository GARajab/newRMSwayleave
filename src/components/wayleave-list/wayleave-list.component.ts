
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WayleaveService } from '../../services/wayleave.service';
import { WayleaveStatus, UserRole, WayleaveRecord, AttachmentInfo } from '../../models/wayleave.model';
import { ModalComponent } from '../modal/modal.component';
import { UpdateStatusFormComponent } from '../update-status-form/update-status-form.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { EditWayleaveFormComponent } from '../edit-wayleave-form/edit-wayleave-form.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-wayleave-list',
  imports: [CommonModule, FormsModule, ModalComponent, UpdateStatusFormComponent, SpinnerComponent, EditWayleaveFormComponent],
  template: `
<div class="bg-white shadow-lg rounded-xl overflow-hidden ring-1 ring-gray-900/5">
  <div class="overflow-x-auto">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wayleave #</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachments</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Update</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200/75">
        @for (record of records(); track record.id; let i = $index) {
          @let lastHistory = record.history[record.history.length - 1];
          @let availableActions = getActionsForRecord(record.status, currentUser());
          @let styles = statusStyles()[record.status];
          <tr class="animate-fade-in-up hover:bg-gray-50/50 transition-colors duration-150" [style.animation-delay]="i * 50 + 'ms'">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ record.wayleaveNumber }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium" [class]="styles.container">
                <div class="h-2 w-2 rounded-full" [class]="styles.dot"></div>
                <span>{{ record.status }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <button (click)="downloadFile(record.attachment)" [disabled]="isDownloading(record.attachment.path)" title="Download Initial Document" class="ml-2 p-1 text-gray-400 hover:text-indigo-600 disabled:text-gray-500 disabled:cursor-wait flex-shrink-0 transition-transform hover:scale-110">
                    @if(isDownloading(record.attachment.path)) {
                      <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    }
                  </button>
                </div>
                @if (record.approvedAttachment) {
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 overflow-hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                      <div class="flex flex-col overflow-hidden">
                        <span class="truncate" [title]="record.approvedAttachment.name">{{ record.approvedAttachment.name }} ({{ formatFileSize(record.approvedAttachment.size) }})</span>
                        <span class="text-xs text-gray-400">Approved Document (TSS)</span>
                      </div>
                    </div>
                     <button (click)="downloadFile(record.approvedAttachment)" [disabled]="isDownloading(record.approvedAttachment.path)" title="Download Approved Document" class="ml-2 p-1 text-gray-400 hover:text-indigo-600 disabled:text-gray-500 disabled:cursor-wait flex-shrink-0 transition-transform hover:scale-110">
                       @if(isDownloading(record.approvedAttachment.path)) {
                        <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      }
                    </button>
                  </div>
                }
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ lastHistory.timestamp | date:'short' }}</td>
            <td class="px-6 py-4 text-sm font-medium">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                @if (currentUser() === 'Admin') {
                  <button (click)="openAdminUpdateModal(record)" class="font-medium text-indigo-600 hover:text-indigo-500 transition-all duration-150 hover:underline">Change Status</button>
                  <button (click)="openEditModal(record)" class="font-medium text-indigo-600 hover:text-indigo-500 transition-all duration-150 hover:underline">Edit</button>
                  <button (click)="openDeleteModal(record)" class="font-medium text-red-600 hover:text-red-500 transition-all duration-150 hover:underline">Delete</button>
                } @else {
                   @for(action of availableActions; track action.label) {
                      <button (click)="openUpdateModal(record, action)" class="font-medium text-indigo-600 hover:text-indigo-500 transition-all duration-150 hover:underline">{{ action.label }}</button>
                  }
                  @if (availableActions.length === 0 && record.status !== 'Completed') {
                    <span class="text-gray-400 italic">No actions available</span>
                  }
                }
              </div>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500">No wayleave records found.</td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>

<!-- Standard User Status Update Modal -->
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
}

<!-- Admin Status Update Modal -->
@if (recordToUpdateAdmin()) {
  <app-modal title="Admin: Change Wayleave Status" (close)="closeAdminUpdateModal()">
    <form (ngSubmit)="handleAdminStatusUpdate()" class="space-y-4">
        <p>Wayleave #<span class="font-bold">{{ recordToUpdateAdmin()!.wayleaveNumber }}</span></p>
        <div>
            <label for="status-select" class="block text-sm font-medium text-gray-700">New Status</label>
            <select id="status-select" name="newStatus" [(ngModel)]="newStatusForAdmin" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                @for(status of allStatuses; track status) {
                    <option [value]="status">{{ status }}</option>
                }
            </select>
        </div>
        @if (newStatusForAdmin === 'Sent to Planning (EDD)') {
          <div>
            <label for="admin-attachment" class="block text-sm font-medium text-gray-700">Approved Document (Required)</label>
            <input type="file" id="admin-attachment" (change)="onAdminFileSelected($event)" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
            <p class="mt-1 text-xs text-gray-500">Please attach the approved wayleave document.</p>
          </div>
        }
         <div class="flex justify-end space-x-4 pt-4">
            <button type="button" (click)="closeAdminUpdateModal()" [disabled]="isUpdatingStatusAdmin()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button type="submit" [disabled]="isUpdatingStatusAdmin() || newStatusForAdmin === recordToUpdateAdmin()!.status" class="flex justify-center items-center w-28 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                @if (isUpdatingStatusAdmin()) { <app-spinner></app-spinner> } @else { <span>Save</span> }
            </button>
        </div>
    </form>
  </app-modal>
}

<!-- Admin Edit Record Modal -->
@if (recordToEdit()) {
  <app-modal title="Admin: Edit Wayleave Record" (close)="closeEditModal()">
    <app-edit-wayleave-form
      [record]="recordToEdit()!"
      [isLoading]="isEditingRecord()"
      (formSubmitted)="handleRecordUpdate($event)"
      (formCancelled)="closeEditModal()">
    </app-edit-wayleave-form>
  </app-modal>
}


<!-- Deletion Modal -->
@if (recordToDelete()) {
  <app-modal title="Confirm Deletion" (close)="closeDeleteModal()">
    <div class="text-center">
      <p class="text-lg text-gray-700 mb-2">Delete wayleave record <span class="font-bold">{{ recordToDelete()!.wayleaveNumber }}</span>?</p>
      <p class="text-sm text-red-600 mb-6">This action is irreversible and will delete all associated attachments.</p>
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
export class WayleaveListComponent {
  wayleaveService = inject(WayleaveService);
  toastService = inject(ToastService);

  records = this.wayleaveService.records;
  currentUser = this.wayleaveService.currentUser;
  downloadingPaths = signal<string[]>([]);

  // State for standard user update flow
  isUpdateModalOpen = signal(false);
  isUpdatingStatus = signal(false);
  recordToUpdate = signal<WayleaveRecord | null>(null);
  actionToPerform = signal<{ label: string, newStatus: WayleaveStatus, actor: UserRole } | null>(null);

  // State for deletion flow
  recordToDelete = signal<WayleaveRecord | null>(null);
  isDeletingRecord = signal(false);

  // State for admin-specific flows
  recordToUpdateAdmin = signal<WayleaveRecord | null>(null);
  isUpdatingStatusAdmin = signal(false);
  newStatusForAdmin: WayleaveStatus = 'Waiting for TSS Action';
  adminFile: File | null = null;
  readonly allStatuses: WayleaveStatus[] = ['Waiting for TSS Action', 'Sent to MOW', 'Sent to Planning (EDD)', 'Completed'];

  recordToEdit = signal<WayleaveRecord | null>(null);
  isEditingRecord = signal(false);


  statusStyles = computed(() => ({
    'Waiting for TSS Action': { container: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
    'Sent to MOW': { container: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
    'Sent to Planning (EDD)': { container: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
    'Completed': { container: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  }));

  getActionsForRecord(status: WayleaveStatus, user: UserRole | null) {
    const actions: { label: string, newStatus: WayleaveStatus, actor: UserRole }[] = [];
    if (!user || user === 'Admin') return actions;

    if (user === 'TSS') {
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

  // --- Standard User Methods ---
  openUpdateModal(record: WayleaveRecord, action: { label: string, newStatus: WayleaveStatus, actor: UserRole }) {
    this.recordToUpdate.set(record);
    this.actionToPerform.set(action);
    this.isUpdateModalOpen.set(true);
  }
  closeUpdateModal() {
    if (this.isUpdatingStatus()) return;
    this.isUpdateModalOpen.set(false);
    this.recordToUpdate.set(null);
    this.actionToPerform.set(null);
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

  // --- Admin Methods ---
  openAdminUpdateModal(record: WayleaveRecord) {
    this.newStatusForAdmin = record.status;
    this.recordToUpdateAdmin.set(record);
    this.adminFile = null;
  }
  closeAdminUpdateModal() {
    if (this.isUpdatingStatusAdmin()) return;
    this.recordToUpdateAdmin.set(null);
  }
  async handleAdminStatusUpdate() {
    const record = this.recordToUpdateAdmin();
    if (!record || record.status === this.newStatusForAdmin) return;
    this.isUpdatingStatusAdmin.set(true);
    try {
      await this.wayleaveService.updateStatus(record.id, this.newStatusForAdmin, 'Admin', this.adminFile || undefined);
      this.toastService.success('Status updated successfully');
      this.closeAdminUpdateModal();
    } catch (e: any) {
      this.toastService.error(`Error: ${e.message}`);
    } finally {
      this.isUpdatingStatusAdmin.set(false);
    }
  }

  openEditModal(record: WayleaveRecord) {
    this.recordToEdit.set(record);
  }
  closeEditModal() {
    if (this.isEditingRecord()) return;
    this.recordToEdit.set(null);
  }
  async handleRecordUpdate(event: { recordId: number, wayleaveNumber: string }) {
    this.isEditingRecord.set(true);
    try {
      await this.wayleaveService.updateRecordDetails(event.recordId, event.wayleaveNumber);
      this.toastService.success('Record updated successfully');
      this.closeEditModal();
    } catch (e: any) {
      this.toastService.error(`Error updating record: ${e.message}`);
    } finally {
      this.isEditingRecord.set(false);
    }
  }

  // --- Deletion Methods ---
  openDeleteModal(record: WayleaveRecord) { this.recordToDelete.set(record); }
  closeDeleteModal() {
    if (this.isDeletingRecord()) return;
    this.recordToDelete.set(null);
  }
  async confirmDeletion() {
    const record = this.recordToDelete();
    if (!record) return;
    this.isDeletingRecord.set(true);
    try {
      await this.wayleaveService.deleteRecord(record.id);
      this.toastService.success('Record deleted successfully');
      this.closeDeleteModal();
    } catch (e: any) {
      this.toastService.error(`Error: ${e.message}`);
    } finally {
      this.isDeletingRecord.set(false);
    }
  }

  // --- Utility Methods ---
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async downloadFile(attachment: AttachmentInfo | undefined) {
    if (!attachment) {
      this.toastService.info('No file available for download.');
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
      this.toastService.error('Could not download file. Please try again.');
    } finally {
      this.downloadingPaths.update(paths => paths.filter(p => p !== attachment.path));
    }
  }

  isDownloading(path: string | undefined): boolean {
    if (!path) return false;
    return this.downloadingPaths().includes(path);
  }

  onAdminFileSelected(event: any) {
    const file = event.target.files[0];
    this.adminFile = file || null;
  }
}

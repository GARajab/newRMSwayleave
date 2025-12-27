
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveService } from '../../services/wayleave.service';
import { WayleaveStatus, UserRole, WayleaveRecord, AttachmentInfo } from '../../models/wayleave.model';
import { ModalComponent } from '../modal/modal.component';
import { UpdateStatusFormComponent } from '../update-status-form/update-status-form.component';

@Component({
  selector: 'app-wayleave-list',
  templateUrl: './wayleave-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ModalComponent, UpdateStatusFormComponent],
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

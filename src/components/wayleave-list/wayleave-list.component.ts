
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveService } from '../../services/wayleave.service';
import { WayleaveStatus, UserRole, WayleaveRecord } from '../../models/wayleave.model';
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

  getActionsForRecord(status: WayleaveStatus, user: UserRole) {
    const actions: { label: string, newStatus: WayleaveStatus, actor: UserRole }[] = [];
    if (user === 'TSS') {
      if (status === 'Waiting for TSS Action') {
        actions.push({ label: 'Send to MOW', newStatus: 'Sent to MOW', actor: 'TSS' });
      } else if (status === 'Sent to MOW') {
        actions.push({ label: 'Send to Planning (EDD)', newStatus: 'Sent to Planning (EDD)', actor: 'TSS' });
      }
    }
    if (user === 'EDD' && status === 'Sent to Planning (EDD)') {
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

  downloadFile(file: File | undefined) {
    if (!file) {
      alert('No file available for download.');
      return;
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}


import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord, WayleaveStatus, UserRole } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-update-status-form',
  templateUrl: './update-status-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SpinnerComponent]
})
export class UpdateStatusFormComponent {
  isLoading = input<boolean>(false);
  record = input.required<WayleaveRecord>();
  action = input.required<{ label: string; newStatus: WayleaveStatus; actor: UserRole }>();
  updateConfirmed = output<File | null>();
  updateCancelled = output<void>();

  approvedAttachment = signal<File | null>(null);
  attachmentName = signal('');

  isFileUploadRequired = computed(() => this.action().newStatus === 'Sent to Planning (EDD)');
  
  isConfirmDisabled = computed(() => (this.isFileUploadRequired() && !this.approvedAttachment()) || this.isLoading());

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.approvedAttachment.set(input.files[0]);
      this.attachmentName.set(input.files[0].name);
    }
  }

  confirm() {
    if (this.isConfirmDisabled()) return;
    this.updateConfirmed.emit(this.approvedAttachment());
  }

  cancel() {
    if (this.isLoading()) return;
    this.updateCancelled.emit();
  }
}

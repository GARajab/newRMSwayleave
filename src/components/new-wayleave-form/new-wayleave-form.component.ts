
import { Component, ChangeDetectionStrategy, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { WayleaveRecord } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-new-wayleave-form',
  templateUrl: './new-wayleave-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ModalComponent, SpinnerComponent],
})
export class NewWayleaveFormComponent {
  isLoading = input<boolean>(false);
  // FIX: Fixed the type definition for the 'formSubmitted' output. The original type created an impossible intersection for the 'attachment' property. The fix is to first omit the original 'attachment' property from WayleaveRecord before adding the desired 'attachment: File' type, which resolves the type error when emitting the form data.
  formSubmitted = output<Omit<WayleaveRecord, 'id' | 'status' | 'history' | 'attachment'> & { attachment: File }>();
  formCancelled = output<void>();

  wayleaveNumber = signal('');
  attachment = signal<File | null>(null);
  attachmentName = signal('');
  isRppdModalOpen = signal(false);
  errorMessage = signal('');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.attachment.set(input.files[0]);
      this.attachmentName.set(input.files[0].name);
      this.validate();
    }
  }

  validate(): boolean {
      this.errorMessage.set('');
      if (!this.wayleaveNumber().trim()) {
        this.errorMessage.set('WayLeave number is required.');
        return false;
      }
      if (!this.attachment()) {
        this.errorMessage.set('A PDF attachment is mandatory.');
        return false;
      }
      return true;
  }

  attemptSubmit(): void {
    if (this.isLoading()) return;
    if (this.validate()) {
      this.isRppdModalOpen.set(true);
    }
  }

  confirmAndSubmit(): void {
    if(this.attachment() && !this.isLoading()) {
        const data = {
            wayleaveNumber: this.wayleaveNumber(),
            attachment: this.attachment()!,
        };
        this.formSubmitted.emit(data);
    }
    // Don't close RPDD modal here, parent will close the main modal which will remove this one
  }

  cancelRppdModal(): void {
    if (this.isLoading()) return;
    this.isRppdModalOpen.set(false);
  }

  cancelForm(): void {
    if (this.isLoading()) return;
    this.formCancelled.emit();
  }
}

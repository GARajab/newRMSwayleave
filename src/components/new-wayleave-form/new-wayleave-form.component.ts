
import { Component, ChangeDetectionStrategy, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { WayleaveRecord } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-new-wayleave-form',
  imports: [CommonModule, FormsModule, ModalComponent, SpinnerComponent],
  template: `
<form (ngSubmit)="attemptSubmit()" #wayleaveForm="ngForm" class="space-y-6">
  <div>
    <label for="wayleaveNumber" class="block text-sm font-medium text-gray-700">WayLeave Number</label>
    <div class="mt-1">
      <input type="text" id="wayleaveNumber" name="wayleaveNumber" [ngModel]="wayleaveNumber()" (ngModelChange)="wayleaveNumber.set($event)" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    </div>
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700">Attachment (PDF Mandatory)</label>
    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
      <div class="space-y-1 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="flex text-sm text-gray-600">
          <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".pdf" required>
          </label>
          <p class="pl-1">or drag and drop</p>
        </div>
        <p class="text-xs text-gray-500">PDF up to 10MB</p>
        @if (attachmentName()) {
          <p class="text-sm text-green-600 pt-2 font-semibold">{{ attachmentName() }} selected</p>
        }
      </div>
    </div>
  </div>

  @if (errorMessage()) {
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">{{ errorMessage() }}</span>
    </div>
  }

  <div class="flex justify-end space-x-4 pt-4">
    <button type="button" (click)="cancelForm()" [disabled]="isLoading()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
      Cancel
    </button>
    <button type="submit" [disabled]="!wayleaveForm.valid || isLoading()" class="flex justify-center items-center w-28 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-100">
      @if (isLoading()) {
        <app-spinner></app-spinner>
      } @else {
        <span>Continue</span>
      }
    </button>
  </div>
</form>

@if (isRppdModalOpen()) {
  <app-modal title="Confirmation" (close)="cancelRppdModal()">
    <div class="text-center">
      <p class="text-lg text-gray-700 mb-6">RPDD approved?</p>
      <div class="flex justify-center space-x-4">
        <button (click)="cancelRppdModal()" [disabled]="isLoading()" class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button (click)="cancelRppdModal()" [disabled]="isLoading()" class="px-6 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50">
          No
        </button>
        <button (click)="confirmAndSubmit()" [disabled]="isLoading()" class="flex justify-center items-center w-24 px-6 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50">
          @if (isLoading()) {
            <app-spinner></app-spinner>
          } @else {
            <span>Yes</span>
          }
        </button>
      </div>
    </div>
  </app-modal>
}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewWayleaveFormComponent {
  isLoading = input<boolean>(false);
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

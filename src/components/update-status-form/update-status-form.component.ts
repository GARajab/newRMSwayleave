
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord, WayleaveStatus, UserRole } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-update-status-form',
  imports: [CommonModule, SpinnerComponent],
  template: `
<div class="space-y-4">
  <p class="text-sm text-gray-600">
    You are about to update the status for Wayleave
    <span class="font-bold text-gray-800">{{ record().wayleaveNumber }}</span>.
  </p>
  
  <div class="bg-gray-100 p-4 rounded-lg">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-gray-500">Current Status</p>
        <p class="font-semibold text-gray-700">{{ record().status }}</p>
      </div>
      <div class="text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
      <div>
        <p class="text-xs text-gray-500">New Status</p>
        <p class="font-semibold text-green-600">{{ action().newStatus }}</p>
      </div>
    </div>
  </div>
  
  @if (isFileUploadRequired()) {
    <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm text-blue-700">
                    To proceed, you must attach the approved permit.
                </p>
            </div>
        </div>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700">Approved Document (PDF Mandatory)</label>
      <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div class="space-y-1 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex text-sm text-gray-600">
            <label for="approved-doc-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Upload a file</span>
              <input id="approved-doc-upload" name="approved-doc-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".pdf" required>
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-gray-500">PDF up to 10MB</p>
          @if (attachmentName()) {
            <p class="text-sm text-green-600 pt-2 font-semibold flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              {{ attachmentName() }}
            </p>
          }
        </div>
      </div>
    </div>
  } @else {
     <p class="text-sm text-gray-600">
        Are you sure you want to proceed with this action?
      </p>
  }

  <div class="flex justify-end space-x-4 pt-4">
    <button type="button" (click)="cancel()" [disabled]="isLoading()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
      Cancel
    </button>
    <button type="button" (click)="confirm()" [disabled]="isConfirmDisabled()" class="flex justify-center items-center w-40 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-100">
      @if(isLoading()) {
        <app-spinner></app-spinner>
      } @else {
        <span>{{ action().label }}</span>
      }
    </button>
  </div>
</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.approvedAttachment.set(file);
        this.attachmentName.set(file.name);
      } else {
        alert('Only PDF files are allowed.');
        this.approvedAttachment.set(null);
        this.attachmentName.set('');
        input.value = ''; // Reset file input
      }
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

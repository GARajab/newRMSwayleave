
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord, WayleaveStatus, UserRole } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-update-status-form',
  imports: [CommonModule, SpinnerComponent],
  template: `
<div class="space-y-4">
  <p class="text-sm text-gray-600 dark:text-gray-300">
    You are about to update the status for Wayleave
    <span class="font-bold text-gray-800 dark:text-gray-100">{{ record().wayleaveNumber }}</span>.
  </p>
  
  <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-slate-500 dark:text-slate-400">Current Status</p>
        <p class="font-semibold text-slate-700 dark:text-slate-200">{{ record().status }}</p>
      </div>
      <div class="text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
      <div>
        <p class="text-xs text-slate-500 dark:text-slate-400">New Status</p>
        <p class="font-semibold text-green-600 dark:text-green-400">{{ action().newStatus }}</p>
      </div>
    </div>
  </div>

  <p class="text-sm text-gray-600 dark:text-gray-300">
    Are you sure you want to proceed with this action?
  </p>

  @if (isFileUploadRequired()) {
    <div class="pt-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Approved Documents (PDF Mandatory)</label>
      <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
        <div class="space-y-1 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex text-sm text-gray-600 dark:text-slate-400">
            <label for="approved-doc-upload" class="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
              <span>Upload a file</span>
              <input id="approved-doc-upload" name="approved-doc-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".pdf" required>
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-500">PDF up to 10MB</p>
          @if (attachmentName()) {
            <p class="text-sm text-green-600 dark:text-green-400 pt-2 font-semibold">{{ attachmentName() }} selected</p>
          }
        </div>
      </div>
    </div>
  }

  <div class="flex justify-end space-x-4 pt-4">
    <button type="button" (click)="cancel()" [disabled]="isLoading()" class="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50">
      Cancel
    </button>
    <button type="button" (click)="confirm()" [disabled]="isConfirmDisabled()" class="flex justify-center items-center w-40 px-4 py-2 bg-sky-500 text-white rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-100">
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


import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WayleaveRecord } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-edit-wayleave-form',
  imports: [CommonModule, FormsModule, SpinnerComponent],
  template: `
<form (ngSubmit)="submitForm()" #editForm="ngForm" class="space-y-6">
  <div>
    <label for="wayleaveNumber" class="block text-sm font-medium text-gray-700">WayLeave Number</label>
    <div class="mt-1">
      <input 
        type="text" 
        id="wayleaveNumber" 
        name="wayleaveNumber" 
        [ngModel]="editableWayleaveNumber()" 
        (ngModelChange)="editableWayleaveNumber.set($event)" 
        required 
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    </div>
  </div>

  <div class="flex justify-end space-x-4 pt-4">
    <button 
      type="button" 
      (click)="cancelForm()" 
      [disabled]="isLoading()" 
      class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
      Cancel
    </button>
    <button 
      type="submit" 
      [disabled]="!editForm.valid || isLoading() || editableWayleaveNumber() === record().wayleaveNumber" 
      class="flex justify-center items-center w-28 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-150">
      @if (isLoading()) {
        <app-spinner></app-spinner>
      } @else {
        <span>Save Changes</span>
      }
    </button>
  </div>
</form>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditWayleaveFormComponent {
  record = input.required<WayleaveRecord>();
  isLoading = input<boolean>(false);
  formSubmitted = output<{ recordId: number, wayleaveNumber: string }>();
  formCancelled = output<void>();

  editableWayleaveNumber = signal('');

  constructor() {
    const record = this.record();
    if (record) {
      this.editableWayleaveNumber.set(record.wayleaveNumber);
    }
  }

  submitForm(): void {
    if (this.isLoading() || !this.editableWayleaveNumber().trim()) return;
    this.formSubmitted.emit({
      recordId: this.record().id,
      wayleaveNumber: this.editableWayleaveNumber(),
    });
  }

  cancelForm(): void {
    if (this.isLoading()) return;
    this.formCancelled.emit();
  }
}


import { Component, ChangeDetectionStrategy, output, signal, input, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WayleaveRecord } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';
import { WayleaveService } from '../../services/wayleave.service';

@Component({
  selector: 'app-new-wayleave-wizard',
  imports: [CommonModule, FormsModule, SpinnerComponent],
  styles: [`
    @keyframes progress-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
    .animate-stripes {
      background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
      background-size: 1rem 1rem;
      animation: progress-stripes 1s linear infinite;
    }
  `],
  template: `
    <div class="flex flex-col space-y-6 relative">
      <!-- RPDD Confirmation Overlay -->
      @if (showRpddConfirmation()) {
        <div class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
            <div class="bg-white p-8 rounded-lg shadow-2xl ring-1 ring-gray-900/10 text-center w-full max-w-md animate-scale-in">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">RPDD Approval Confirmation</h3>
                <p class="text-gray-600 mb-6">Is RPDD approved for this Wayleave?</p>
                
                @if (rpddError()) {
                    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md relative mb-4 text-sm" role="alert">
                      <strong class="font-bold">Cannot Proceed:</strong>
                      <span class="block sm:inline ml-1">{{ rpddError() }}</span>
                    </div>
                }

                <div class="flex justify-center items-center space-x-4">
                    <button (click)="handleRpddConfirmNo()" class="px-6 py-2 border rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">No</button>
                    <button (click)="handleRpddCancel()" class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Cancel</button>
                    <button (click)="handleRpddConfirmYes()" class="px-6 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">Yes</button>
                </div>
            </div>
        </div>
      }

      <!-- TSS Confirmation Overlay -->
      @if (showTssConfirmation()) {
        <div class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in">
            <div class="bg-white p-8 rounded-lg shadow-2xl ring-1 ring-gray-900/10 text-center w-full max-w-md animate-scale-in">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Final Confirmation</h3>
                <p class="text-gray-600 mb-6">Please confirm that no liaise is required before sending to TSS.</p>
                <div class="flex justify-center items-center space-x-4">
                    <button (click)="handleTssCancel()" [disabled]="isLoading()" class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">Cancel</button>
                    <button (click)="handleTssConfirm()" [disabled]="isLoading()" class="flex justify-center items-center w-44 px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                      @if (isLoading()) {
                        <app-spinner></app-spinner>
                      } @else {
                        <span>Confirm & Send</span>
                      }
                    </button>
                </div>
            </div>
        </div>
      }

      <!-- Progress Bar -->
      <div>
        <div class="flex justify-between mb-1">
          <span class="text-base font-medium text-indigo-700">Step {{ currentStep() }} of 2</span>
          <span class="text-sm font-medium text-indigo-700">{{ progressText() }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out animate-stripes" [style.width.%]="progressWidth()"></div>
        </div>
      </div>
      
      <!-- Wizard Content -->
      <div class="min-h-[250px] flex flex-col">
        @switch (currentStep()) {
          @case (1) {
            <!-- Step 1: Wayleave Details -->
            <div class="animate-fade-in space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">Wayleave Details</h3>
              <div>
                <label for="wayleaveNumber" class="block text-sm font-medium text-gray-700">Wayleave Number</label>
                <div class="mt-1">
                  <input type="text" id="wayleaveNumber" name="wayleaveNumber" 
                         [ngModel]="wayleaveNumber()" (ngModelChange)="onWayleaveNumberChange($event)" 
                         required 
                         class="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         placeholder="e.g., WL-2024-001">
                </div>
                @if (duplicateError()) {
                  <p class="mt-2 text-sm text-red-600" id="wayleave-number-error">
                    {{ duplicateError() }}
                  </p>
                }
              </div>
            </div>
          }
          @case (2) {
            <!-- Step 2: Upload Document -->
            <div class="animate-fade-in space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">Upload Initial Document</h3>
              <div>
                <label class="block text-sm font-medium text-gray-700">Attachment (PDF Mandatory)</label>
                <div 
                  class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors"
                  [class.border-indigo-500]="isDragging()"
                  [class.bg-indigo-50]="isDragging()"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)">
                  <div class="space-y-1 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-gray-600">
                      <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".pdf">
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
            </div>
          }
        }
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-end space-x-4 pt-4 border-t">
        @if (currentStep() > 1) {
          <button type="button" (click)="previousStep()" [disabled]="isLoading()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Back
          </button>
        } @else {
           <button type="button" (click)="cancelForm()" [disabled]="isLoading()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
        }

        @if (currentStep() < 2) {
          <button type="button" (click)="nextStep()" [disabled]="!isStepValid() || isCheckingDuplicates()" class="flex justify-center items-center w-28 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            @if(isCheckingDuplicates()) {
                <app-spinner></app-spinner>
            } @else {
                <span>Next</span>
            }
          </button>
        } @else {
          <button type="button" (click)="submitForm()" [disabled]="!isStepValid() || isLoading()" class="flex justify-center items-center w-28 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            @if (isLoading()) {
              <app-spinner></app-spinner>
            } @else {
              <span>Submit</span>
            }
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewWayleaveWizardComponent {
  wayleaveService = inject(WayleaveService);
  isLoading = input<boolean>(false);
  formSubmitted = output<Omit<WayleaveRecord, 'id' | 'status' | 'history' | 'attachment'> & { attachment: File }>();
  formCancelled = output<void>();

  currentStep = signal(1);
  wayleaveNumber = signal('');
  attachment = signal<File | null>(null);
  attachmentName = signal('');
  
  showRpddConfirmation = signal(false);
  showTssConfirmation = signal(false);
  rpddError = signal<string | null>(null);
  isDragging = signal(false);
  
  duplicateError = signal<string | null>(null);
  isCheckingDuplicates = signal(false);


  // New signal for the animated width of the progress bar
  progressWidth = signal(0);

  constructor() {
    // Effect to update progress width with a slight delay for animation
    effect(() => {
        const step = this.currentStep();
        const target = (step / 2) * 100;
        
        // Timeout allows the DOM to render the initial state (e.g. 0% or previous step)
        // before applying the new width, ensuring the CSS transition triggers visibly.
        setTimeout(() => {
            this.progressWidth.set(target);
        }, 100);
    });
  }

  isStepValid = computed(() => {
    switch(this.currentStep()) {
      case 1: return this.wayleaveNumber().trim().length > 0 && !this.duplicateError();
      case 2: return !!this.attachment();
      default: return false;
    }
  });
  
  // Note: This computed is used for the text display "Step 1 of 2", not the width itself anymore.
  progressPercentage = computed(() => {
    return (this.currentStep() / 2) * 100;
  });

  progressText = computed(() => {
     switch(this.currentStep()) {
      case 1: return 'Details';
      case 2: return 'Document Upload';
      default: return '';
    }
  });

  private handleFile(file: File): void {
    if (file.type === 'application/pdf') {
      this.attachment.set(file);
      this.attachmentName.set(file.name);
    } else {
      alert('Only PDF files are allowed.');
      this.attachment.set(null);
      this.attachmentName.set('');
    }
  }
  
  onWayleaveNumberChange(value: string): void {
    this.wayleaveNumber.set(value);
    // Clear the error message as the user types
    if (this.duplicateError()) {
      this.duplicateError.set(null);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    input.value = ''; // Reset input to allow selecting the same file again
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  
  async nextStep(): Promise<void> {
    if (!this.isStepValid()) return;
    
    if (this.currentStep() === 1) {
      this.isCheckingDuplicates.set(true);
      this.duplicateError.set(null);
      try {
        const exists = await this.wayleaveService.checkWayleaveNumberExists(this.wayleaveNumber().trim());
        if (exists) {
          this.duplicateError.set(`Wayleave number "${this.wayleaveNumber()}" already exists.`);
        } else {
          this.rpddError.set(null);
          this.showRpddConfirmation.set(true);
        }
      } catch (error) {
        this.duplicateError.set('Error checking wayleave number. Please try again.');
      } finally {
        this.isCheckingDuplicates.set(false);
      }
    } else if (this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  submitForm(): void {
    if (this.isLoading() || !this.isStepValid()) return;
    this.showTssConfirmation.set(true);
  }

  cancelForm(): void {
    if (this.isLoading()) return;
    this.formCancelled.emit();
  }
  
  handleRpddConfirmYes(): void {
    this.showRpddConfirmation.set(false);
    this.rpddError.set(null);
    this.currentStep.set(2);
  }

  handleRpddConfirmNo(): void {
    this.rpddError.set('RPDD approval is required to proceed.');
  }

  handleRpddCancel(): void {
    this.showRpddConfirmation.set(false);
  }

  handleTssConfirm(): void {
    if (this.isLoading()) return;
    
    if(this.attachment()) {
        const data = {
            wayleaveNumber: this.wayleaveNumber(),
            attachment: this.attachment()!,
        };
        this.formSubmitted.emit(data);
    }
  }

  handleTssCancel(): void {
    this.showTssConfirmation.set(false);
  }
}

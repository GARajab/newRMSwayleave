import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 animate-fade-in-up"
          [ngClass]="{
            'bg-green-50 text-green-800 border border-green-200': toast.type === 'success',
            'bg-red-50 text-red-800 border border-red-200': toast.type === 'error',
            'bg-blue-50 text-blue-800 border border-blue-200': toast.type === 'info'
          }">
          <div class="flex justify-between items-start">
            <p class="text-sm font-medium">{{ toast.message }}</p>
            <button (click)="toastService.remove(toast.id)" class="ml-4 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
    toastService = inject(ToastService);
}
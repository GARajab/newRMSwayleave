
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-overview',
  imports: [CommonModule],
  template: `
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Total Wayleaves -->
  <div class="bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-900/5 flex items-center space-x-4 animate-fade-in-up">
    <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    </div>
    <div>
      <p class="text-sm font-medium text-gray-500">Total Wayleaves</p>
      <p class="text-2xl font-bold text-gray-900">{{ totalRecords() }}</p>
    </div>
  </div>

  <!-- Pending Users -->
  <div class="bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-900/5 flex items-center space-x-4 animate-fade-in-up" style="animation-delay: 100ms;">
    <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-yellow-100 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div>
      <p class="text-sm font-medium text-gray-500">Pending Users</p>
      <p class="text-2xl font-bold text-gray-900">{{ pendingUsers() }}</p>
    </div>
  </div>

  <!-- Waiting for TSS -->
  <div class="bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-900/5 flex items-center space-x-4 animate-fade-in-up" style="animation-delay: 200ms;">
    <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <div>
      <p class="text-sm font-medium text-gray-500">Waiting for TSS</p>
      <p class="text-2xl font-bold text-gray-900">{{ waitingTss() }}</p>
    </div>
  </div>

  <!-- In Progress -->
  <div class="bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-900/5 flex items-center space-x-4 animate-fade-in-up" style="animation-delay: 300ms;">
    <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-purple-100 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
    </div>
    <div>
      <p class="text-sm font-medium text-gray-500">In Progress</p>
      <p class="text-2xl font-bold text-gray-900">{{ inProgress() }}</p>
    </div>
  </div>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverviewComponent {
  totalRecords = input.required<number>();
  pendingUsers = input.required<number>();
  waitingTss = input.required<number>();
  inProgress = input.required<number>();
}

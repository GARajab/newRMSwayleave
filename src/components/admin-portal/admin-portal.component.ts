
import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementComponent } from '../user-management/user-management.component';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';

type AdminView = 'dashboard' | 'users';

@Component({
  selector: 'app-admin-portal',
  imports: [CommonModule, UserManagementComponent, AdminDashboardComponent],
  template: `
<div class="flex">
  <!-- Sidebar Navigation -->
  <aside class="w-64 bg-white p-4 border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16">
    <nav class="flex flex-col space-y-2">
      <button (click)="activeView.set('dashboard')" 
              [class.bg-indigo-50]="activeView() === 'dashboard'"
              [class.text-indigo-700]="activeView() === 'dashboard'"
              class="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Admin Dashboard</span>
      </button>

      <button (click)="activeView.set('users')" 
              [class.bg-indigo-50]="activeView() === 'users'"
              [class.text-indigo-700]="activeView() === 'users'"
              class="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1-3.72a4 4 0 00-3-3.263l-1-1c-1.12-1.12-1.83-2.64-1.83-4.31a4 4 0 116.63-3.26l1 .5" />
        </svg>
        <span>User Management</span>
      </button>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
    <div class="max-w-7xl mx-auto">
       <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          @switch (activeView()) {
            @case ('dashboard') { Admin Dashboard }
            @case ('users') { User Management }
          }
        </h1>
        @if (activeView() === 'dashboard') {
            <button (click)="openNewWayleaveModal.emit()" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 hover:scale-105 active:scale-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span>New Wayleave</span>
            </button>
        }
      </div>

      @switch (activeView()) {
        @case ('dashboard') { <app-admin-dashboard></app-admin-dashboard> }
        @case ('users') { <app-user-management></app-user-management> }
      }
    </div>
  </main>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPortalComponent {
  activeView = signal<AdminView>('dashboard');
  openNewWayleaveModal = output<void>();
}

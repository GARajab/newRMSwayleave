
import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementComponent } from '../user-management/user-management.component';
import { WayleaveListComponent } from '../wayleave-list/wayleave-list.component';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';

type AdminView = 'overview' | 'users' | 'wayleaves';

@Component({
  selector: 'app-admin-portal',
  imports: [CommonModule, AdminOverviewComponent, UserManagementComponent, WayleaveListComponent],
  template: `
<div class="flex">
  <!-- Sidebar Navigation -->
  <aside class="w-64 bg-white dark:bg-slate-800/50 p-4 border-r border-slate-200 dark:border-slate-700/50 h-[calc(100vh-4rem)] sticky top-16">
    <nav class="flex flex-col space-y-2">
      <button (click)="activeView.set('overview')" 
              [class.bg-sky-100]="activeView() === 'overview'"
              [class.dark:bg-sky-500/10]="activeView() === 'overview'"
              [class.text-sky-600]="activeView() === 'overview'"
              [class.dark:text-sky-400]="activeView() === 'overview'"
              class="flex items-center space-x-3 p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Overview</span>
      </button>

      <button (click)="activeView.set('users')" 
              [class.bg-sky-100]="activeView() === 'users'"
              [class.dark:bg-sky-500/10]="activeView() === 'users'"
              [class.text-sky-600]="activeView() === 'users'"
              [class.dark:text-sky-400]="activeView() === 'users'"
              class="flex items-center space-x-3 p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1-3.72a4 4 0 00-3-3.263l-1-1c-1.12-1.12-1.83-2.64-1.83-4.31a4 4 0 116.63-3.26l1 .5" />
        </svg>
        <span>User Management</span>
      </button>

      <button (click)="activeView.set('wayleaves')"
              [class.bg-sky-100]="activeView() === 'wayleaves'"
              [class.dark:bg-sky-500/10]="activeView() === 'wayleaves'"
              [class.text-sky-600]="activeView() === 'wayleaves'"
              [class.dark:text-sky-400]="activeView() === 'wayleaves'"
              class="flex items-center space-x-3 p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Wayleaves</span>
      </button>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
    <div class="max-w-7xl mx-auto">
       <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          @switch (activeView()) {
            @case ('overview') { Admin Dashboard }
            @case ('users') { User Management }
            @case ('wayleaves') { Wayleave Records }
          }
        </h1>
        @if (activeView() === 'wayleaves') {
            <button (click)="openNewWayleaveModal.emit()" class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-150 hover:scale-105 active:scale-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span>New Wayleave</span>
            </button>
        }
      </div>

      @switch (activeView()) {
        @case ('overview') { <app-admin-overview></app-admin-overview> }
        @case ('users') { <app-user-management></app-user-management> }
        @case ('wayleaves') { <app-wayleave-list></app-wayleave-list> }
      }
    </div>
  </main>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPortalComponent {
  activeView = signal<AdminView>('overview');
  openNewWayleaveModal = output<void>();
}

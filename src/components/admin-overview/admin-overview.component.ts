import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { WayleaveService } from '../../services/wayleave.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-admin-overview',
  imports: [CommonModule, SpinnerComponent],
  template: `
@if(isLoadingStats()) {
    <div class="flex justify-center items-center p-12 col-span-1 sm:col-span-2 lg:col-span-4">
        <app-spinner message="Loading stats..."></app-spinner>
    </div>
} @else {
    <div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl p-6 ring-1 ring-slate-900/5 flex items-center space-x-4">
        <div class="bg-blue-100 dark:bg-blue-500/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.084-1.283-.24-1.887M7 16H5v-2a3 3 0 015.356-1.857M7 16v-2c0-.653.084-1.283.24-1.887m10.48-2.625A1.875 1.875 0 1015.875 6.25a1.875 1.875 0 00-1.635 2.625m-6.25 0A1.875 1.875 0 108.125 6.25 1.875 1.875 0 006.5 8.875" /></svg>
        </div>
        <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalUsers() }}</p>
        </div>
    </div>
    <div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl p-6 ring-1 ring-slate-900/5 flex items-center space-x-4">
        <div class="bg-yellow-100 dark:bg-yellow-500/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Pending Activation</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ pendingUsers() }}</p>
        </div>
    </div>
    <div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl p-6 ring-1 ring-slate-900/5 flex items-center space-x-4">
        <div class="bg-indigo-100 dark:bg-indigo-500/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Wayleaves in Progress</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ inProgressWayleaves() }}</p>
        </div>
    </div>
    <div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl p-6 ring-1 ring-slate-900/5 flex items-center space-x-4">
        <div class="bg-green-100 dark:bg-green-500/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Completed Wayleaves</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ completedWayleaves() }}</p>
        </div>
    </div>
}
  `,
  host: {
    class: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in mb-8'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverviewComponent implements OnInit {
  private authService = inject(AuthService);
  private wayleaveService = inject(WayleaveService);

  isLoadingStats = signal(true);
  totalUsers = signal<number | string>(0);
  pendingUsers = signal<number | string>(0);
  
  private records = this.wayleaveService.records;

  inProgressWayleaves = computed(() => this.records().filter(w => w.status !== 'Completed').length);
  completedWayleaves = computed(() => this.records().filter(w => w.status === 'Completed').length);

  async ngOnInit() {
    this.isLoadingStats.set(true);
    try {
      const userList = await this.authService.listAllUsers();
      this.totalUsers.set(userList.length);
      this.pendingUsers.set(userList.filter(u => u.status === 'pending').length);
    } catch (err: any) {
        console.error("Admin Overview: Could not load user stats. This is likely due to the client-side Supabase key lacking admin privileges to list all users. This is expected for security reasons. The user management page will show a more specific error.", err);
        this.totalUsers.set('N/A');
        this.pendingUsers.set('N/A');
    } finally {
        this.isLoadingStats.set(false);
    }
  }
}

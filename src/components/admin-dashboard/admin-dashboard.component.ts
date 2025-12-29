
import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';
import { WayleaveListComponent } from '../wayleave-list/wayleave-list.component';
import { WayleaveService } from '../../services/wayleave.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, AdminOverviewComponent, WayleaveListComponent, SpinnerComponent],
  template: `
<div class="space-y-8">
  @if (isLoadingUsers()) {
    <div class="h-24 flex items-center justify-center">
        <app-spinner></app-spinner>
    </div>
  } @else {
    <app-admin-overview
      [totalRecords]="totalRecords()"
      [pendingUsers]="pendingUsers()"
      [waitingTss]="waitingTss()"
      [inProgress]="inProgress()">
    </app-admin-overview>
  }
  
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      <h2 class="text-xl font-bold tracking-tight text-gray-900">All Wayleave Records</h2>
      <div class="relative w-64">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
          </div>
          <input 
              type="search"
              #searchInput
              (input)="onSearchTermChange(searchInput.value)"
              [value]="wayleaveService.searchTerm()"
              placeholder="Search by Wayleave #" 
              class="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
    </div>
    <app-wayleave-list></app-wayleave-list>
  </div>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private wayleaveService = inject(WayleaveService);
  private authService = inject(AuthService);
  
  allRecords = this.wayleaveService.records;
  users = signal<UserProfile[]>([]);
  isLoadingUsers = signal(true);

  totalRecords = computed(() => this.allRecords().length);
  pendingUsers = computed(() => this.users().filter(u => u.status === 'pending').length);
  waitingTss = computed(() => this.allRecords().filter(r => r.status === 'Waiting for TSS Action').length);
  inProgress = computed(() => this.allRecords().filter(r => r.status === 'Sent to MOW' || r.status === 'Sent to Planning (EDD)').length);

  async ngOnInit() {
    this.isLoadingUsers.set(true);
    try {
      this.users.set(await this.authService.listAllUsers());
    } catch (e) {
      console.error("Failed to load users for dashboard overview", e);
      // Silently fail, the card will just show 0
    } finally {
      this.isLoadingUsers.set(false);
    }
  }

  onSearchTermChange(term: string): void {
    this.wayleaveService.searchTerm.set(term);
  }
}

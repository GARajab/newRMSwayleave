
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
    <h2 class="text-xl font-bold tracking-tight text-gray-900 mb-4">All Wayleave Records</h2>
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
}

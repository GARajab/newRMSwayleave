
import { Component, ChangeDetectionStrategy, input, output, signal, ElementRef, HostListener, viewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  template: `
<header class="bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg sticky top-0 z-30 shadow-sm border-b border-slate-200 dark:border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center space-x-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-xl font-semibold text-slate-900 dark:text-white">Wayleave RMS</span>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-right">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" [title]="userEmail()">{{ userEmail() }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ userRole() }}</p>
        </div>
        <div class="relative" #notificationContainer>
          <div (click)="toggleNotificationPanel()" class="cursor-pointer">
             <app-notification-bell [count]="notificationCount()"></app-notification-bell>
          </div>
          @if (isNotificationPanelOpen()) {
            <div class="animate-scale-in origin-top-right">
              <app-notification-list [notifications]="notifications()"></app-notification-list>
            </div>
          }
        </div>
        <button (click)="onLogout()" title="Sign Out" class="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotificationBellComponent, NotificationListComponent]
})
export class HeaderComponent {
  notifications = input.required<WayleaveRecord[]>();
  notificationCount = input.required<number>();
  logout = output<void>();

  private authService = inject(AuthService);
  
  userEmail = computed(() => this.authService.session()?.user?.email);
  userRole = computed(() => this.authService.currentUserRole());

  isNotificationPanelOpen = signal(false);
  notificationContainer = viewChild<ElementRef>('notificationContainer');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isNotificationPanelOpen() && !this.notificationContainer()?.nativeElement.contains(event.target)) {
      this.closeNotificationPanel();
    }
  }

  toggleNotificationPanel() {
    this.isNotificationPanelOpen.update(value => !value);
  }

  closeNotificationPanel() {
    this.isNotificationPanelOpen.set(false);
  }

  onLogout() {
    this.logout.emit();
  }
}

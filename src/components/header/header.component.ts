
import { Component, ChangeDetectionStrategy, input, output, signal, ElementRef, HostListener, viewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
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

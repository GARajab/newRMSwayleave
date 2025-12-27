
import { Component, ChangeDetectionStrategy, input, output, signal, ElementRef, HostListener, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole, ALL_USER_ROLES, WayleaveRecord } from '../../models/wayleave.model';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotificationBellComponent, NotificationListComponent]
})
export class HeaderComponent {
  currentUser = input.required<UserRole>();
  notifications = input.required<WayleaveRecord[]>();
  notificationCount = input.required<number>();
  roleChanged = output<UserRole>();

  allRoles = ALL_USER_ROLES;
  isNotificationPanelOpen = signal(false);

  notificationContainer = viewChild<ElementRef>('notificationContainer');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isNotificationPanelOpen() && !this.notificationContainer()?.nativeElement.contains(event.target)) {
      this.closeNotificationPanel();
    }
  }

  onRoleChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.roleChanged.emit(selectElement.value as UserRole);
  }

  toggleNotificationPanel() {
    this.isNotificationPanelOpen.update(value => !value);
  }

  closeNotificationPanel() {
    this.isNotificationPanelOpen.set(false);
  }
}

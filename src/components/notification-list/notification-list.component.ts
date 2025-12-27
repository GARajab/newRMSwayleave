
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class NotificationListComponent {
  notifications = input.required<WayleaveRecord[]>();
}

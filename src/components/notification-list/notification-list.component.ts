
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';

@Component({
  selector: 'app-notification-list',
  imports: [CommonModule],
  template: `
<div class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
  <div class="py-2 px-4 border-b border-gray-200">
    <h3 class="font-semibold text-gray-800">Notifications</h3>
  </div>
  <div class="max-h-96 overflow-y-auto">
    @if (notifications().length > 0) {
      <ul>
        @for (notification of notifications(); track notification.id) {
          <li class="border-b border-gray-200 last:border-b-0">
            <a href="#" class="block p-4 hover:bg-gray-50 transition-colors">
              <p class="font-semibold text-sm text-gray-700">Action Required</p>
              <p class="text-sm text-gray-500">
                Wayleave <span class="font-medium text-gray-800">{{ notification.wayleaveNumber }}</span> is at status: <span class="font-medium text-gray-800">{{ notification.status }}</span>.
              </p>
            </a>
          </li>
        }
      </ul>
    } @else {
      <div class="p-4 text-center text-sm text-gray-500">
        You have no new notifications.
      </div>
    }
  </div>
</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent {
  notifications = input.required<WayleaveRecord[]>();
}

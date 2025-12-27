
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayleaveRecord } from '../../models/wayleave.model';

@Component({
  selector: 'app-notification-list',
  imports: [CommonModule],
  template: `
<div class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg overflow-hidden z-20 border border-slate-200 dark:border-slate-700">
  <div class="py-2 px-4 border-b border-slate-200 dark:border-slate-700">
    <h3 class="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
  </div>
  <div class="max-h-96 overflow-y-auto">
    @if (notifications().length > 0) {
      <ul>
        @for (notification of notifications(); track notification.id) {
          <li class="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            <a href="#" class="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <p class="font-semibold text-sm text-slate-700 dark:text-slate-300">Action Required</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Wayleave <span class="font-medium text-slate-800 dark:text-slate-200">{{ notification.wayleaveNumber }}</span> is at status: <span class="font-medium text-slate-800 dark:text-slate-200">{{ notification.status }}</span>.
              </p>
            </a>
          </li>
        }
      </ul>
    } @else {
      <div class="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
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

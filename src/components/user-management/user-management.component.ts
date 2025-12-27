
import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '@supabase/supabase-js';
import { AuthService, AugmentedUser } from '../../services/auth.service';
import { UserRole } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule, SpinnerComponent, ModalComponent],
  template: `
<div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl ring-1 ring-slate-900/5">
    <div class="p-4 border-b border-slate-200 dark:border-slate-700">
        <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
            </div>
            <input 
                type="search" 
                (input)="searchTerm.set($event.target.value)"
                placeholder="Search by email..." 
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-slate-700 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
    </div>
    @if (isLoading()) {
        <div class="p-12 flex justify-center items-center">
            <app-spinner message="Loading users..."></app-spinner>
        </div>
    } @else if (error()) {
        <div class="p-8 text-center">
            <p class="text-red-500 dark:text-red-400 font-semibold">Error</p>
            <p class="text-slate-600 dark:text-slate-300 mt-2">{{ error() }}</p>
        </div>
    } @else {
        <div class="overflow-x-auto">
            <table class="min-w-full">
            <thead class="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200/75 dark:divide-slate-700/50">
                @for(user of filteredUsers(); track user.id; let i = $index) {
                    @let status = getUserStatus(user);
                    @let role = getUserRole(user);
                    <tr class="animate-fade-in-up hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-150" [style.animation-delay]="i * 50 + 'ms'">
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <p class="font-medium text-gray-900 dark:text-white">{{ user.email }}</p>
                            <p class="text-gray-500 dark:text-gray-400">Registered: {{ user.created_at | date:'shortDate' }}</p>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                             @if(status === 'active') {
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                                    Active
                                </span>
                            } @else {
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400">
                                    Pending
                                </span>
                            }
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                           @if (status === 'active') {
                                <select 
                                    [ngModel]="role" 
                                    (change)="onRoleChange(user, $event)"
                                    [disabled]="user.id === selfId || updatingStates()[user.id]"
                                    class="block w-full max-w-[150px] pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="Unassigned">Unassigned</option>
                                    @for(r of assignableRoles; track r) {
                                        <option [value]="r">{{ r }}</option>
                                    }
                                </select>
                           } @else {
                               <span class="text-gray-400 dark:text-gray-500 italic">N/A</span>
                           }
                        </td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center space-x-2">
                                @if (status === 'active') {
                                    <button 
                                        (click)="saveRoleChange(user)" 
                                        [disabled]="!isRoleChanged(user) || updatingStates()[user.id] || user.id === selfId"
                                        class="flex justify-center items-center w-20 px-3 py-1.5 bg-sky-500 text-white text-xs rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                                        @if (updatingStates()[user.id] && isRoleChanged(user)) {
                                            <app-spinner></app-spinner>
                                        } @else {
                                            <span>Save</span>
                                        }
                                    </button>
                                } @else {
                                    <button
                                        (click)="activateUser(user)"
                                        [disabled]="updatingStates()[user.id]"
                                        class="flex justify-center items-center w-24 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                                        @if (updatingStates()[user.id]) {
                                            <app-spinner></app-spinner>
                                        } @else {
                                            <span>Activate</span>
                                        }
                                    </button>
                                }
                                <button
                                    (click)="openDeleteConfirmModal(user)"
                                    [disabled]="user.id === selfId || updatingStates()[user.id]"
                                    title="Delete User"
                                    class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-full disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                } @empty {
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                            {{ searchTerm() ? 'No users match your search.' : 'No users found.' }}
                        </td>
                    </tr>
                }
            </tbody>
            </table>
        </div>
    }
</div>

@if (isConfirmAdminModalOpen() && userToMakeAdmin()) {
  <app-modal title="Confirm Admin Promotion" (close)="closeAdminConfirmModal()">
    <div class="text-center">
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Are you sure you want to grant
        <span class="font-bold">full administrator privileges</span> 
        to {{ userToMakeAdmin()!.email }}?
      </p>
      <div class="flex justify-center space-x-4">
        <button (click)="closeAdminConfirmModal()" class="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
          Cancel
        </button>
        <button (click)="confirmAdminPromotion()" class="px-6 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
          Yes, grant admin
        </button>
      </div>
    </div>
  </app-modal>
}

@if (isConfirmDeleteModalOpen() && userToDelete()) {
  <app-modal title="Confirm User Deletion" (close)="closeDeleteConfirmModal()">
    <div class="text-center">
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">
        Are you sure you want to permanently delete this user?
      </p>
      <p class="font-semibold text-slate-800 dark:text-slate-100 mb-4">{{ userToDelete()!.email }}</p>
      <p class="text-sm text-red-600 dark:text-red-400 mb-6">This action is irreversible and will remove all associated data.</p>
      <div class="flex justify-center space-x-4">
        <button (click)="closeDeleteConfirmModal()" class="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
          Cancel
        </button>
        <button (click)="confirmDeletion()" class="flex justify-center items-center w-32 px-6 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
           @if(isDeleting()) {
            <app-spinner></app-spinner>
           } @else {
            <span>Yes, Delete</span>
           }
        </button>
      </div>
    </div>
  </app-modal>
}
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  
  users = signal<AugmentedUser[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  
  selectedRoles: { [userId: string]: UserRole } = {};
  updatingStates = signal<Record<string, boolean>>({});

  isConfirmAdminModalOpen = signal(false);
  userToMakeAdmin = signal<AugmentedUser | null>(null);

  isConfirmDeleteModalOpen = signal(false);
  userToDelete = signal<AugmentedUser | null>(null);
  isDeleting = signal(false);

  readonly assignableRoles: UserRole[] = ['PLANNING', 'TSS', 'EDD', 'Admin'];
  readonly selfId = this.authService.session()?.user.id;

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users();
    return this.users().filter(user => user.email?.toLowerCase().includes(term));
  });

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      const userList = await this.authService.listAllUsers();
      this.users.set(userList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      this.error.set(null);
    } catch (err: any) {
      console.error('Failed to fetch users:', err.message, err);
      if (err.message.includes('insufficient privileges')) {
         this.error.set(`Security Error: Your Supabase API key lacks permissions for user management. Use the 'service_role' key for this feature. Warning: Do not expose this in a production browser environment.`);
      } else {
         this.error.set('Failed to load user data. Check console for details.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
  
  getUserStatus(user: AugmentedUser): 'active' | 'pending' {
    return user.status;
  }

  getUserRole(user: AugmentedUser): UserRole {
    return user.role;
  }
  
  onRoleChange(user: AugmentedUser, event: Event) {
    const selectedRole = (event.target as HTMLSelectElement).value as UserRole;
    if (selectedRole === 'Admin') {
      this.userToMakeAdmin.set(user);
      this.isConfirmAdminModalOpen.set(true);
      // Reset dropdown visually until confirmed
      (event.target as HTMLSelectElement).value = this.getUserRole(user);
    } else {
      this.selectedRoles[user.id] = selectedRole;
    }
  }

  confirmAdminPromotion() {
    const user = this.userToMakeAdmin();
    if (user) {
      this.selectedRoles[user.id] = 'Admin';
      this.saveRoleChange(user);
    }
    this.closeAdminConfirmModal();
  }

  closeAdminConfirmModal() {
    this.isConfirmAdminModalOpen.set(false);
    this.userToMakeAdmin.set(null);
  }
  
  isRoleChanged(user: AugmentedUser): boolean {
    return this.selectedRoles[user.id] && this.selectedRoles[user.id] !== this.getUserRole(user);
  }

  async activateUser(user: AugmentedUser) {
    if (this.updatingStates()[user.id]) return;
    this.updatingStates.update(s => ({ ...s, [user.id]: true }));

    try {
      const updatedUser = await this.authService.activateUser(user);
      this.users.update(users => users.map(u => u.id === user.id ? updatedUser : u));
    } catch (err: any) {
      alert(`Error activating user: ${err.message}`);
    } finally {
      this.updatingStates.update(s => ({ ...s, [user.id]: false }));
    }
  }
  
  async saveRoleChange(user: AugmentedUser) {
    const newRole = this.selectedRoles[user.id];
    if (!newRole || this.updatingStates()[user.id]) return;

    this.updatingStates.update(s => ({ ...s, [user.id]: true }));

    try {
      const updatedUser = await this.authService.updateUserRole(user, newRole);
      this.users.update(users => users.map(u => u.id === user.id ? updatedUser : u));
      delete this.selectedRoles[user.id];
    } catch (err: any) {
      console.error('Failed to update role:', err.message, err);
      alert(`Error updating role for ${user.email}: ${err.message}`);
    } finally {
      this.updatingStates.update(s => ({ ...s, [user.id]: false }));
    }
  }

  openDeleteConfirmModal(user: AugmentedUser) {
    this.userToDelete.set(user);
    this.isConfirmDeleteModalOpen.set(true);
  }

  closeDeleteConfirmModal() {
    if (this.isDeleting()) return;
    this.userToDelete.set(null);
    this.isConfirmDeleteModalOpen.set(false);
  }

  async confirmDeletion() {
    const user = this.userToDelete();
    if (!user) return;
    
    this.isDeleting.set(true);
    try {
      await this.authService.deleteUser(user.id);
      this.users.update(currentUsers => currentUsers.filter(u => u.id !== user.id));
      this.closeDeleteConfirmModal();
    } catch (err: any) {
      console.error('Failed to delete user:', err.message, err);
      alert(`Error deleting user: ${err.message}`);
    } finally {
      this.isDeleting.set(false);
    }
  }
}

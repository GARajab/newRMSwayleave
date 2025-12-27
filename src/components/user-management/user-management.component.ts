
import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '@supabase/supabase-js';
import { AuthService, AugmentedUser } from '../../services/auth.service';
import { UserRole } from '../../models/wayleave.model';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SpinnerComponent, DatePipe, ModalComponent],
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);
  
  users = signal<AugmentedUser[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  selectedRoles: { [userId: string]: UserRole } = {};
  updatingStates = signal<Record<string, boolean>>({});

  isConfirmAdminModalOpen = signal(false);
  userToMakeAdmin = signal<AugmentedUser | null>(null);

  readonly assignableRoles: UserRole[] = ['PLANNING', 'TSS', 'EDD', 'Admin'];
  readonly selfId = this.authService.session()?.user.id;

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
}

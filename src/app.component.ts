
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { WayleaveListComponent } from './components/wayleave-list/wayleave-list.component';
import { NewWayleaveFormComponent } from './components/new-wayleave-form/new-wayleave-form.component';
import { ModalComponent } from './components/modal/modal.component';
import { WayleaveService } from './services/wayleave.service';
import { UserRole, WayleaveRecord } from './models/wayleave.model';
import { SpinnerComponent } from './components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, WayleaveListComponent, NewWayleaveFormComponent, ModalComponent, SpinnerComponent],
})
export class AppComponent implements OnInit {
  wayleaveService = inject(WayleaveService);

  isAppLoading = signal(true);
  isNewWayleaveModalOpen = signal(false);
  isCreatingWayleave = signal(false);

  currentUser = this.wayleaveService.currentUser;
  
  notifications = computed(() => {
    const user = this.currentUser();
    return this.wayleaveService.records().filter(record => {
      if (user === 'TSS' && record.status === 'Waiting for TSS Action') return true;
      if (user === 'EDD' && record.status === 'Sent to Planning (EDD)') return true;
      return false;
    });
  });

  notificationCount = computed(() => this.notifications().length);

  async ngOnInit() {
    await this.wayleaveService.initializeData();
    this.isAppLoading.set(false);
  }

  handleRoleChange(role: UserRole) {
    this.currentUser.set(role);
  }

  openNewWayleaveModal() {
    this.isNewWayleaveModalOpen.set(true);
  }

  closeNewWayleaveModal() {
    if (this.isCreatingWayleave()) return;
    this.isNewWayleaveModalOpen.set(false);
  }

  async handleWayleaveCreated(record: Omit<WayleaveRecord, 'id' | 'status' | 'history'> & { attachment: File }) {
    this.isCreatingWayleave.set(true);
    await this.wayleaveService.addRecord(record.wayleaveNumber, record.attachment);
    this.isCreatingWayleave.set(false);
    this.isNewWayleaveModalOpen.set(false);
  }
}


import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { WayleaveListComponent } from './components/wayleave-list/wayleave-list.component';
import { NewWayleaveFormComponent } from './components/new-wayleave-form/new-wayleave-form.component';
import { ModalComponent } from './components/modal/modal.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { LoginComponent } from './components/login/login.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HeaderComponent,
    WayleaveListComponent,
    NewWayleaveFormComponent,
    ModalComponent,
    SpinnerComponent,
    LoginComponent,
    UserManagementComponent
  ],
  providers: [
    provideZonelessChangeDetection()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

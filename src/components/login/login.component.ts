
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SpinnerComponent]
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  viewMode = signal<'login' | 'register'>('login');

  email = signal('');
  password = signal('');
  confirmPassword = signal('');

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  async handleLogin(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.email().trim();
    const password = this.password();

    if (!email.endsWith('@ewa.bh')) {
      this.errorMessage.set('Access is restricted to @ewa.bh domain emails only.');
      this.isLoading.set(false);
      return;
    }

    try {
      await this.authService.signIn(email, password);
      // On successful login, the app component will detect the session change and switch views.
    } catch (error: any) {
      console.error('Login failed:', error.message, error);
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('users') && (errorMsg.includes('does not exist') || errorMsg.includes('could not find the table'))) {
        this.errorMessage.set('Database setup incomplete: The "users" table is missing. Please contact your administrator to run the initial database setup script.');
      } else {
        this.errorMessage.set(error.message || 'An unexpected error occurred during login.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleRegister(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.email().trim();
    const password = this.password();
    const confirm = this.confirmPassword();

    if (!email.endsWith('@ewa.bh')) {
      this.errorMessage.set('Access is restricted to @ewa.bh domain emails only.');
      this.isLoading.set(false);
      return;
    }
    if (password !== confirm) {
        this.errorMessage.set('Passwords do not match.');
        this.isLoading.set(false);
        return;
    }
     if (password.length < 6) {
        this.errorMessage.set('Password must be at least 6 characters long.');
        this.isLoading.set(false);
        return;
    }

    try {
      await this.authService.signUp(email, password);
      this.successMessage.set('Registration successful! An administrator must activate your account before you can log in.');
      this.setView('login');
      this.email.set('');
      this.password.set('');
      this.confirmPassword.set('');
    } catch (error: any) {
      console.error('Registration failed:', error.message, error);
       if (error.message.includes('already registered')) {
        this.errorMessage.set('This email is already registered.');
       } else {
        this.errorMessage.set(error.message || 'An unexpected error occurred during registration.');
       }
    } finally {
      this.isLoading.set(false);
    }
  }

  setView(mode: 'login' | 'register'): void {
    this.viewMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}

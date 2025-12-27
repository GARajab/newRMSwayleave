
import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, SpinnerComponent],
  template: `
<div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
  <div class="w-full max-w-md">
    <div class="flex items-center justify-center space-x-4 mb-8">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Wayleave RMS</h1>
    </div>

    <div class="bg-white dark:bg-slate-800/50 shadow-lg rounded-xl p-8 ring-1 ring-slate-900/5">
      <h2 class="text-2xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
        @if(isAdminLogin()) {
          <span class="text-indigo-600 dark:text-indigo-400">Admin Portal</span>
        } @else {
          <span>{{ viewMode() === 'login' ? 'Sign In' : 'Create Account' }}</span>
        }
      </h2>
      
      @if(successMessage()) {
        <div class="mb-4 bg-green-100 dark:bg-green-500/10 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md text-sm">
          <p>{{ successMessage() }}</p>
        </div>
      }

      @if(viewMode() === 'login') {
        <form (ngSubmit)="handleLogin()" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <div class="mt-1">
              <input type="email" id="email" name="email" [ngModel]="email()" (ngModelChange)="email.set($event)" placeholder="user@ewa.bh" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400" />
            </div>
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div class="mt-1">
              <input type="password" id="password" name="password" [ngModel]="password()" (ngModelChange)="password.set($event)" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400" />
            </div>
          </div>
          
          @if(errorMessage()) {
            <div class="bg-red-100 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md text-sm">
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <div>
            <button type="submit" [disabled]="isLoading() || !email() || !password()" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              [class.bg-sky-600]="!isAdminLogin()"
              [class.hover:bg-sky-700]="!isAdminLogin()"
              [class.focus:ring-sky-500]="!isAdminLogin()"
              [class.bg-indigo-600]="isAdminLogin()"
              [class.hover:bg-indigo-700]="isAdminLogin()"
              [class.focus:ring-indigo-500]="isAdminLogin()">
              @if(isLoading()) { <app-spinner></app-spinner> } @else { 
                <span>{{ isAdminLogin() ? 'Sign In as Admin' : 'Sign In' }}</span> 
              }
            </button>
          </div>
        </form>
         <p class="mt-6 text-center text-sm">
          <span class="text-gray-600 dark:text-gray-400">Don't have an account?</span>
          <button (click)="setView('register')" class="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Sign up
          </button>
        </p>
      } @else {
         <form (ngSubmit)="handleRegister()" class="space-y-6">
          <div>
            <label for="reg-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <div class="mt-1">
              <input type="email" id="reg-email" name="reg-email" [ngModel]="email()" (ngModelChange)="email.set($event)" placeholder="user@ewa.bh" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400" />
            </div>
          </div>
          <div>
            <label for="reg-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div class="mt-1">
              <input type="password" id="reg-password" name="reg-password" [ngModel]="password()" (ngModelChange)="password.set($event)" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400" />
            </div>
          </div>
           <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <div class="mt-1">
              <input type="password" id="confirm-password" name="confirm-password" [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400" />
            </div>
          </div>
          
          @if(errorMessage()) {
            <div class="bg-red-100 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md text-sm">
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <div>
            <button type="submit" [disabled]="isLoading() || !email() || !password() || !confirmPassword()" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if(isLoading()) { <app-spinner></app-spinner> } @else { <span>Sign Up</span> }
            </button>
          </div>
        </form>
         <p class="mt-6 text-center text-sm">
          <span class="text-gray-600 dark:text-gray-400">Already have an account?</span>
          <button (click)="setView('login')" class="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Sign in
          </button>
        </p>
      }
    </div>
    <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      Access restricted to authorized personnel only.
    </p>
  </div>
</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  isAdminLogin = computed(() => this.email().toLowerCase() === 'mohamed.rajab@ewa.bh');
  
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

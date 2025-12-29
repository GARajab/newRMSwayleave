
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { WayleaveListComponent } from './components/wayleave-list/wayleave-list.component';
import { NewWayleaveWizardComponent } from './components/new-wayleave-wizard/new-wayleave-wizard.component';
import { ModalComponent } from './components/modal/modal.component';
import { WayleaveService } from './services/wayleave.service';
import { UserRole, WayleaveRecord } from './models/wayleave.model';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { AdminPortalComponent } from './components/admin-portal/admin-portal.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    HeaderComponent,
    WayleaveListComponent,
    NewWayleaveWizardComponent,
    ModalComponent,
    SpinnerComponent,
    LoginComponent,
    AdminPortalComponent
  ],
  template: `
@if(isCheckingSession()) {
  <div class="fixed inset-0 flex items-center justify-center bg-gray-50">
    <app-spinner></app-spinner>
  </div>
} @else if (!session() && !appError()) {
  <app-login></app-login>
} @else if (isAppLoading()) {
  <div class="fixed inset-0 flex items-center justify-center bg-gray-50">
    <app-spinner></app-spinner>
  </div>
} @else if (appError()) {
  @if (setupInstructions()) {
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 p-4 sm:p-8">
      <div class="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden ring-1 ring-gray-900/5">
        <div class="p-6 border-b border-gray-200 bg-red-50">
          <h3 class="font-bold text-xl text-red-800 flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Action Required: Database Setup</span>
          </h3>
          <p class="mt-2 text-base text-red-700">{{ appError() }}</p>
        </div>
        <div class="p-6 space-y-6 bg-gray-50 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <p class="text-gray-600">To complete the application setup, please run the following SQL script in your Supabase SQL Editor.</p>
          
          <!-- Step 1: Database Script -->
          <div class="p-4 border rounded-md bg-white">
            <h4 class="font-semibold text-lg text-gray-800 mb-2">Step 1: Run the Database Setup Script</h4>
             <p class="text-sm text-gray-600 mb-2">This script will create the necessary tables, roles, and security policies for the application to function correctly.</p>
            <div class="relative mt-2">
              <button (click)="copyToClipboard(setupInstructions()!.sqlScript, 'sqlScript')" class="absolute top-2 right-2 px-3 py-1 bg-gray-200 text-xs font-medium rounded-md hover:bg-gray-300">
                {{ copySuccess() === 'sqlScript' ? 'Copied!' : 'Copy Script' }}
              </button>
              <pre class="bg-gray-100 p-2 rounded-md overflow-x-auto text-xs max-h-96"><code>{{ setupInstructions()!.sqlScript }}</code></pre>
            </div>
          </div>
          
          <p class="text-center font-semibold text-gray-700 pt-4">After running the script, refresh this page.</p>

        </div>
      </div>
    </div>
  } @else {
    <div class="fixed inset-0 flex items-center justify-center bg-gray-50 p-8">
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-lg max-w-2xl ring-1 ring-red-500/20">
        <h3 class="font-bold text-lg mb-2 text-red-800">Application Error</h3>
        <p class="text-base">{{ appError() }}</p>
      </div>
    </div>
  }
} @else {
  <div class="min-h-screen bg-gray-50 text-gray-800">
    <app-header 
      [notifications]="notifications()"
      [notificationCount]="notificationCount()"
      (logout)="handleLogout()">
    </app-header>
    
    @if (currentUser() === 'Admin') {
      <app-admin-portal (openNewWayleaveModal)="openNewWayleaveModal()"></app-admin-portal>
    } @else {
      <main class="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <!-- Left side: Title and Refresh -->
            <div class="flex items-center gap-4">
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  Wayleave Dashboard
              </h1>
              <button (click)="refreshData()" [disabled]="isRefreshing()" title="Refresh Data" class="p-2 rounded-full text-gray-500 hover:bg-gray-200 disabled:cursor-wait disabled:opacity-50 transition-colors">
                @if (isRefreshing()) {
                  <svg class="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 17H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" /></svg>
                }
              </button>
            </div>
             <!-- Right side: Search and Actions -->
            <div class="flex items-center gap-4">
                <div class="relative w-64">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <input 
                        type="search"
                        #searchInput
                        (input)="onSearchTermChange(searchInput.value)"
                        [value]="wayleaveService.searchTerm()"
                        placeholder="Search by Wayleave #" 
                        class="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                @if (currentUser() === 'PLANNING') {
                    <button (click)="openNewWayleaveModal()" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 hover:scale-105 active:scale-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    <span>New Wayleave</span>
                    </button>
                }
            </div>
          </div>
          <app-wayleave-list></app-wayleave-list>
        </div>
      </main>
    }

    @if (isNewWayleaveModalOpen()) {
      <app-modal title="Initiate New Wayleave" (close)="closeNewWayleaveModal()">
        <app-new-wayleave-wizard
          [isLoading]="isCreatingWayleave()"
          (formSubmitted)="handleWayleaveCreated($event)" 
          (formCancelled)="closeNewWayleaveModal()">
        </app-new-wayleave-wizard>
      </app-modal>
    }
  </div>
}
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  wayleaveService = inject(WayleaveService);
  authService = inject(AuthService);

  isAppLoading = signal(true);
  isCheckingSession = signal(true);
  isNewWayleaveModalOpen = signal(false);
  isCreatingWayleave = signal(false);
  isRefreshing = signal(false);
  appError = signal<string | null>(null);
  setupInstructions = signal<{ sqlScript: string } | null>(null);
  copySuccess = signal<'sqlScript' | null>(null);

  session = this.authService.session;
  currentUser = this.wayleaveService.currentUser;
  
  notifications = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.wayleaveService.records().filter(record => {
      if (user === 'TSS' && record.status === 'Waiting for TSS Action') return true;
      if (user === 'EDD' && record.status === 'Sent to Planning (EDD)') return true;
      // Admins see all notifications
      if (user === 'Admin') {
         if (record.status === 'Waiting for TSS Action' || record.status === 'Sent to Planning (EDD)') return true;
      }
      return false;
    });
  });

  notificationCount = computed(() => this.notifications().length);

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      // When session becomes available, load app data and start real-time updates.
      // When session is cleared (logout), stop real-time updates.
      if (this.session()) {
        this.isAppLoading.set(true);
        this.appError.set(null);
        this.setupInstructions.set(null);
        this.initializeAppData();
        this.wayleaveService.startRealtimeUpdates();
      } else {
        this.wayleaveService.stopRealtimeUpdates();
      }
    });
    
    destroyRef.onDestroy(() => {
        this.wayleaveService.stopRealtimeUpdates();
    });

    // Watch for runtime errors from auth service (e.g., during login)
    effect(() => {
      const error = this.authService.runtimeError();
      if (error) {
        this.handleAppError(error);
      }
    });
  }

  async ngOnInit() {
    // This resolves when the initial session check is done.
    await this.authService.isInitialized; 

    // After initialization, check if a critical error occurred (e.g., schema mismatch).
    const initError = this.authService.initializationError();
    if (initError) {
      // If an initialization error is found, the app cannot proceed.
      // Display the error page with the setup script immediately.
      this.handleAppError(initError, 'A database schema error was detected during application startup.');
    }
    this.isCheckingSession.set(false);
  }

  private handleAppError(error: any, userFriendlyMessage?: string) {
    console.error('Application Error:', error);
    const instructions = this.getSetupInstructions();
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Detect if the error indicates an incomplete database setup.
    const isSetupError = errorMessage?.includes('does not exist') ||
                         errorMessage?.includes('Could not find the table') ||
                         errorMessage?.includes('setup is incomplete');

    if (isSetupError) {
       this.appError.set(userFriendlyMessage || 'Application setup is incomplete.');
       this.setupInstructions.set(instructions);
       console.info('--- SUPABASE SETUP REQUIRED --- \nPlease follow the on-screen instructions to set up the database.');
    } else if (errorMessage?.includes('new row violates row-level security policy')) {
       this.appError.set(`Database permission error. Your user role may not have the required permissions to perform this action. Please contact your administrator.`);
    } else if (errorMessage?.includes('insufficient privileges')) {
       this.appError.set(`Security Error: Your Supabase API key lacks the required permissions for user management. To enable this feature, you must use the 'service_role' key. Warning: Do not expose this key in a production browser environment. This feature is intended for admin panels running in a secure server environment.`);
    } else {
       this.appError.set(`An unexpected error occurred. Please check the developer console for more details. The error was: ${errorMessage}`);
    }
  }

  async initializeAppData() {
    try {
      await this.wayleaveService.initializeData();
    } catch (error: any) {
      this.handleAppError(error, 'Your database is missing required tables or functions.');
    } finally {
      this.isAppLoading.set(false);
    }
  }

  openNewWayleaveModal() {
    this.isNewWayleaveModalOpen.set(true);
  }

  closeNewWayleaveModal() {
    if (this.isCreatingWayleave()) return;
    this.isNewWayleaveModalOpen.set(false);
  }

  async handleWayleaveCreated(record: Omit<WayleaveRecord, 'id' | 'status' | 'history' | 'attachment'> & { attachment: File }) {
    this.isCreatingWayleave.set(true);
    try {
      await this.wayleaveService.addRecord(record.wayleaveNumber, record.attachment);
    } catch (error: any) {
        alert(`Error creating record: ${error.message}`);
    } finally {
      this.isCreatingWayleave.set(false);
      this.isNewWayleaveModalOpen.set(false);
    }
  }

  async refreshData() {
    this.isRefreshing.set(true);
    try {
      await this.wayleaveService.initializeData();
    } catch (error: any) {
      alert(`Failed to refresh data: ${error.message}`);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  async handleLogout() {
    try {
      await this.authService.signOut();
    } catch (error: any) {
      alert(`Error signing out: ${error.message}`);
    }
  }
  
  onSearchTermChange(term: string): void {
    this.wayleaveService.searchTerm.set(term);
  }
  
  async copyToClipboard(content: string, type: 'sqlScript'): Promise<void> {
    if (!content) return;
    try {
        await navigator.clipboard.writeText(content);
        this.copySuccess.set(type);
        setTimeout(() => this.copySuccess.set(null), 2500);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy. Please copy manually from the text area.');
    }
  }

  private getSetupInstructions(): { sqlScript: string } {
    const sqlScript = `-- Wayleave Management System Setup Script
-- This script creates tables, roles, and security policies for the application.

-- 1. Manage the user profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'Unassigned',
  status TEXT DEFAULT 'pending'
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE public.users u SET created_at = a.created_at FROM auth.users a WHERE u.id = a.id;
ALTER TABLE public.users ALTER COLUMN created_at DROP DEFAULT;

-- 2. Create the table for wayleave records
CREATE TABLE IF NOT EXISTS public.wayleave_records (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  wayleave_number TEXT NOT NULL,
  status TEXT NOT NULL,
  history JSONB NOT NULL,
  attachment_name TEXT NOT NULL,
  attachment_path TEXT NOT NULL,
  attachment_size BIGINT NOT NULL,
  approved_attachment_name TEXT,
  approved_attachment_path TEXT,
  approved_attachment_size BIGINT
);

-- 3. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wayleave-attachments', 'wayleave-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Helper function for RLS
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to create user profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT := 'Unassigned';
  new_status TEXT := 'pending';
BEGIN
  -- Defensive check: Do not create a profile if one already exists for this user ID.
  IF EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
    RETURN new;
  END IF;

  -- Default status for all new users is 'pending' and role is 'Unassigned'.
  -- This directly implements the requirement that new users are not active by default.

  -- Special case: Assign 'Admin' role and 'active' status for the predefined admin email.
  IF lower(new.email) = 'mohamed.rajab@ewa.bh' THEN
    new_role := 'Admin';
    new_status := 'active';
  END IF;
  
  INSERT INTO public.users (id, email, created_at, role, status)
  VALUES (new.id, new.email, new.created_at, new_role, new_status);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Enable RLS and define policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wayleave_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users;
CREATE POLICY "Allow users to read their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.users;
CREATE POLICY "Allow admins to manage all profiles" ON public.users FOR ALL TO authenticated USING (get_current_user_role() = 'Admin') WITH CHECK (get_current_user_role() = 'Admin');
DROP POLICY IF EXISTS "Allow admins to delete users" ON public.users;
CREATE POLICY "Allow admins to delete users" ON public.users FOR DELETE TO authenticated USING (get_current_user_role() = 'Admin');
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.wayleave_records;
CREATE POLICY "Allow authenticated read access" ON public.wayleave_records FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "Allow PLANNING and Admin to insert" ON public.wayleave_records;
CREATE POLICY "Allow PLANNING and Admin to insert" ON public.wayleave_records FOR INSERT TO authenticated WITH CHECK ( (get_current_user_role() IN ('PLANNING', 'Admin')) );
DROP POLICY IF EXISTS "Allow role-based updates" ON public.wayleave_records;
CREATE POLICY "Allow role-based updates" ON public.wayleave_records FOR UPDATE TO authenticated USING ( (get_current_user_role() = 'TSS' AND status IN ('Waiting for TSS Action', 'Sent to MOW')) OR (get_current_user_role() = 'EDD' AND status = 'Sent to Planning (EDD)') OR (get_current_user_role() = 'Admin') ) WITH CHECK ( (get_current_user_role() = 'TSS' AND status IN ('Waiting for TSS Action', 'Sent to MOW')) OR (get_current_user_role() = 'EDD' AND status = 'Sent to Planning (EDD)') OR (get_current_user_role() = 'Admin') );
DROP POLICY IF EXISTS "Allow Admin to delete" ON public.wayleave_records;
CREATE POLICY "Allow Admin to delete" ON public.wayleave_records FOR DELETE TO authenticated USING ( (get_current_user_role() = 'Admin') );
DROP POLICY IF EXISTS "Allow authenticated select access on attachments" ON storage.objects;
CREATE POLICY "Allow authenticated select access on attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'wayleave-attachments');
DROP POLICY IF EXISTS "Allow PLANNING and Admin to insert attachments" ON storage.objects;
CREATE POLICY "Allow PLANNING and Admin to insert attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'wayleave-attachments' AND (get_current_user_role() IN ('PLANNING', 'Admin')) );

-- 7. Add a setup verification function for the client application
CREATE OR REPLACE FUNCTION check_setup_status()
RETURNS jsonb AS $$
DECLARE
  missing_items text[] := ARRAY[]::text[];
BEGIN
  -- Check for tables
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wayleave_records') THEN
    missing_items := array_append(missing_items, 'table: wayleave_records');
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    missing_items := array_append(missing_items, 'table: users');
  END IF;

  IF array_length(missing_items, 1) > 0 THEN
    RETURN jsonb_build_object('is_complete', false, 'missing', missing_items);
  ELSE
    RETURN jsonb_build_object('is_complete', true);
  END IF;
END;
$$ LANGUAGE plpgsql;
`;
    return { sqlScript };
  }
}

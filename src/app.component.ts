
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { WayleaveListComponent } from './components/wayleave-list/wayleave-list.component';
// FIX: Corrected typo in component name from NewLeaveFormComponent to NewWayleaveFormComponent.
import { NewWayleaveFormComponent } from './components/new-wayleave-form/new-wayleave-form.component';
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
    NewWayleaveFormComponent,
    ModalComponent,
    SpinnerComponent,
    LoginComponent,
    AdminPortalComponent
  ],
  template: `
@if(isCheckingSession()) {
  <div class="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <app-spinner></app-spinner>
  </div>
} @else if (!session() && !appError()) {
  <app-login></app-login>
} @else if (isAppLoading()) {
  <div class="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <app-spinner></app-spinner>
  </div>
} @else if (appError()) {
  @if (setupSqlScript()) {
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 sm:p-8">
      <div class="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
          <h3 class="font-bold text-xl text-red-800 dark:text-red-200 flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Action Required: Database Setup</span>
          </h3>
          <p class="mt-2 text-base text-red-700 dark:text-red-300">{{ appError() }}</p>
        </div>
        <div class="p-6 space-y-6 bg-slate-50 dark:bg-slate-800/50">
          <p class="text-slate-600 dark:text-slate-300">To get the application running, please run the following SQL script in your Supabase project's SQL Editor.</p>
          
          <div class="relative">
            <button (click)="copySetupSql()" class="absolute top-2 right-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
              @if(copySuccess()) {
                <span class="text-green-600 dark:text-green-400">Copied!</span>
              } @else {
                <span>Copy Script</span>
              }
            </button>
            <pre class="bg-slate-100 dark:bg-slate-900/70 p-4 rounded-md overflow-x-auto text-sm text-slate-800 dark:text-slate-200 max-h-60 sm:max-h-80 border border-slate-200 dark:border-slate-700"><code>{{ setupSqlScript() }}</code></pre>
          </div>

          <div>
             <h4 class="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-3">Instructions</h4>
             <ol class="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Click the <strong>"Copy Script"</strong> button above.</li>
                <li>Go to your project dashboard on <a href="https://supabase.com/" target="_blank" rel="noopener" class="text-sky-500 hover:underline font-medium">supabase.com</a>.</li>
                <li>In the left menu, navigate to the <strong class="font-semibold text-slate-700 dark:text-slate-200">SQL Editor</strong> (database icon).</li>
                <li>Click <strong class="font-semibold text-slate-700 dark:text-slate-200">"+ New query"</strong>, paste the script, and click <strong class="font-semibold text-green-600 dark:text-green-400">"RUN"</strong>.</li>
                <li>Once the script is successful, <strong class="font-semibold text-slate-700 dark:text-slate-200">refresh this page</strong>.</li>
             </ol>
          </div>
        </div>
      </div>
    </div>
  } @else {
    <div class="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
      <div class="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-lg max-w-2xl ring-1 ring-red-500/20">
        <h3 class="font-bold text-lg mb-2 text-red-800 dark:text-red-200">Application Error</h3>
        <p class="text-base">{{ appError() }}</p>
      </div>
    </div>
  }
} @else {
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
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
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Wayleave Dashboard
              </h1>
              <button (click)="refreshData()" [disabled]="isRefreshing()" title="Refresh Data" class="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:cursor-wait disabled:opacity-50 transition-colors">
                @if (isRefreshing()) {
                  <svg class="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5m0 0l-5-5m5 5l-5 5M4 4l5 5" />
                  </svg>
                }
              </button>
            </div>
            <div class="flex items-center gap-4">
              @if (currentUser() === 'PLANNING') {
                <button (click)="openNewWayleaveModal()" class="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-150 hover:scale-105 active:scale-100">
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
        <app-new-wayleave-form 
          [isLoading]="isCreatingWayleave()"
          (formSubmitted)="handleWayleaveCreated($event)" 
          (formCancelled)="closeNewWayleaveModal()">
        </app-new-wayleave-form>
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
  setupSqlScript = signal<string | null>(null);
  copySuccess = signal(false);

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
    effect(async () => {
      // When session becomes available (user logs in), load app data.
      if (this.session()) {
        this.isAppLoading.set(true);
        this.appError.set(null);
        this.setupSqlScript.set(null);
        await this.initializeAppData();
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

  private handleAppError(error: any, userFriendlyMessage: string) {
    console.error('Application Error:', error);
    const setupSQL = this.getSetupSQL();
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (errorMessage?.includes('does not exist') || errorMessage?.includes('Could not find the table')) {
       this.appError.set(userFriendlyMessage);
       this.setupSqlScript.set(setupSQL);
       console.info('--- SUPABASE SETUP SCRIPT --- \nPlease run the following SQL in your Supabase project\'s SQL Editor to create the necessary tables, storage bucket, and security policies:\n\n' + setupSQL);
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
      this.handleAppError(error, 'Your database is missing the required tables or columns.');
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
      this.isNewWayleaveModalOpen.set(false);
    } catch (error: any) {
        alert(`Error creating record: ${error.message}`);
    } finally {
      this.isCreatingWayleave.set(false);
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
  
  async copySetupSql(): Promise<void> {
    const script = this.setupSqlScript();
    if (!script) return;
    try {
        await navigator.clipboard.writeText(script);
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2500);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy script. Please copy it manually from the text area.');
    }
  }

  private getSetupSQL(): string {
    return `-- Wayleave Management System Setup Script
-- This script creates necessary tables, roles, and security policies. It is idempotent.

-- 1. Manage the user profiles table and its columns for migration
-- First, ensure the table exists.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'Unassigned',
  status TEXT DEFAULT 'pending'
);

-- Safely add the 'created_at' column. Add it with a temporary default value and NOT NULL
-- constraint to prevent errors on existing databases.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill 'created_at' with the correct signup time from the auth.users table.
-- This will overwrite the temporary default value with the accurate historical data.
UPDATE public.users u
SET created_at = a.created_at
FROM auth.users a
WHERE u.id = a.id;

-- After backfilling, remove the temporary default. The handle_new_user trigger below
-- will be responsible for providing this value for all new sign-ups.
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

-- 3. Create a bucket for storing file attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wayleave-attachments', 'wayleave-attachments', FALSE) -- Set to FALSE for better security
ON CONFLICT (id) DO NOTHING;

-- 4. Helper function to get the current user's role from the public.users table.
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- In Codium environments, a void auth.uid() can cause errors.
  -- This handles the case where it might not be available during a check.
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Set up the trigger to create a user profile when a new user signs up.
-- This function will be called by the trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wayleave_records ENABLE ROW LEVEL SECURITY;


-- 7. Define RLS Policies for public.users table
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users;
CREATE POLICY "Allow users to read their own profile" ON public.users
FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.users;
CREATE POLICY "Allow admins to manage all profiles" ON public.users
FOR ALL TO authenticated USING (get_current_user_role() = 'Admin')
WITH CHECK (get_current_user_role() = 'Admin');

DROP POLICY IF EXISTS "Allow admins to delete users" ON public.users;
CREATE POLICY "Allow admins to delete users" ON public.users
FOR DELETE TO authenticated USING (get_current_user_role() = 'Admin');


-- 8. Define RLS Policies for public.wayleave_records table
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.wayleave_records;
CREATE POLICY "Allow authenticated read access" ON public.wayleave_records
FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Allow PLANNING and Admin to insert" ON public.wayleave_records;
CREATE POLICY "Allow PLANNING and Admin to insert" ON public.wayleave_records
FOR INSERT TO authenticated WITH CHECK ( (get_current_user_role() IN ('PLANNING', 'Admin')) );

DROP POLICY IF EXISTS "Allow role-based updates" ON public.wayleave_records;
CREATE POLICY "Allow role-based updates" ON public.wayleave_records
FOR UPDATE TO authenticated USING (
  (get_current_user_role() = 'TSS' AND status IN ('Waiting for TSS Action', 'Sent to MOW')) OR
  (get_current_user_role() = 'EDD' AND status = 'Sent to Planning (EDD)') OR
  (get_current_user_role() = 'Admin')
) WITH CHECK (
  (get_current_user_role() = 'TSS' AND status IN ('Waiting for TSS Action', 'Sent to MOW')) OR
  (get_current_user_role() = 'EDD' AND status = 'Sent to Planning (EDD)') OR
  (get_current_user_role() = 'Admin')
);

DROP POLICY IF EXISTS "Allow Admin to delete" ON public.wayleave_records;
CREATE POLICY "Allow Admin to delete" ON public.wayleave_records
FOR DELETE TO authenticated USING ( (get_current_user_role() = 'Admin') );


-- 9. Define RLS Policies for storage.objects
DROP POLICY IF EXISTS "Allow authenticated select access on attachments" ON storage.objects;
CREATE POLICY "Allow authenticated select access on attachments" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'wayleave-attachments');

DROP POLICY IF EXISTS "Allow PLANNING and Admin to insert attachments" ON storage.objects;
CREATE POLICY "Allow PLANNING and Admin to insert attachments" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'wayleave-attachments' AND
  (get_current_user_role() IN ('PLANNING', 'Admin'))
);

-- Clean up old, unused function
DROP FUNCTION IF EXISTS get_my_role();
`;
  }
}

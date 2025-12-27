
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
import { UserManagementComponent } from './components/user-management/user-management.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, WayleaveListComponent, NewWayleaveFormComponent, ModalComponent, SpinnerComponent, LoginComponent, UserManagementComponent],
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
  
  currentView = signal<'dashboard' | 'users'>('dashboard');

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
    this.isCheckingSession.set(false);
  }

  async initializeAppData() {
    try {
      await this.wayleaveService.initializeData();
    } catch (error: any) {
      console.error('Failed to initialize application:', error.message, error);
      const setupSQL = this.getSetupSQL();
      
      if (error.message?.includes('does not exist') || error.message?.includes('Could not find the table')) {
         this.appError.set(`Your database is missing the required tables.`);
         this.setupSqlScript.set(setupSQL);
         console.info('--- SUPABASE SETUP SCRIPT --- \nPlease run the following SQL in your Supabase project\'s SQL Editor to create the necessary tables, storage bucket, and security policies:\n\n' + setupSQL);
      } else if (error.message?.includes('new row violates row-level security policy')) {
         this.appError.set(`Database permission error. Your user role may not have the required permissions to perform this action. Please contact your administrator.`);
      } else if (error.message?.includes('insufficient privileges')) {
         this.appError.set(`Security Error: Your Supabase API key lacks the required permissions for user management. To enable this feature, you must use the 'service_role' key. Warning: Do not expose this key in a production browser environment. This feature is intended for admin panels running in a secure server environment.`);
      } else {
         this.appError.set(`Failed to load data from the database. This could be a network issue or a problem with your Supabase Row Level Security (RLS) policies. Please check your browser's developer console for more details. The error was: ${error.message}`);
      }
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
      if (this.currentView() === 'dashboard') {
        await this.wayleaveService.initializeData();
      } else {
        await this.initializeAppData(); 
      }
    } catch (error: any) {
      alert(`Failed to refresh data: ${error.message}`);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  async handleLogout() {
    try {
      await this.authService.signOut();
      this.currentView.set('dashboard');
    } catch (error: any) {
      alert(`Error signing out: ${error.message}`);
    }
  }
  
  setView(view: 'dashboard' | 'users') {
    this.currentView.set(view);
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
-- This script creates necessary tables, roles, and security policies.

-- 1. Create a table for user profiles
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'Unassigned',
  status TEXT DEFAULT 'pending'
);

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
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
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

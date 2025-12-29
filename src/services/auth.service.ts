
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '../models/wayleave.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  session = signal<Session | null>(null);
  
  currentUserRole = signal<UserRole | null>(null);
  initializationError = signal<string | null>(null);
  runtimeError = signal<string | null>(null);

  isInitialized: Promise<void>;
  private resolveInitialized!: () => void;

  constructor() {
    this.isInitialized = new Promise(resolve => {
        this.resolveInitialized = resolve;
    });

    let initialAuthEventProcessed = false;

    this.supabaseService.onAuthStateChange(async (event, session) => {
      // signIn() provides the authoritative profile, so we can ignore the SIGNED_IN event
      // to prevent a race condition where this listener might fetch a stale profile.
      if (event === 'SIGNED_IN') {
        return;
      }

      // TOKEN_REFRESHED means the user is the same, just with a new token.
      // We only update the session object to avoid UI shifts.
      if (event === 'TOKEN_REFRESHED' && session) {
        this.session.set(session);
        return;
      }

      // For INITIAL_SESSION, SIGNED_OUT, and other events, we do a full validation.
      try {
        await this.setSessionAndProfile(session);
      } catch (error: any) {
        console.error('Error during auth state change, forcing sign out.', error);
        // Catch errors like database being down or RLS issues during profile fetch.
        // If there's an error, we can't trust the state, so sign out.
        if (error.message?.includes('does not exist') && !initialAuthEventProcessed) {
            // This is a critical setup error on first load.
            this.initializationError.set(error.message);
        }
        await this.supabaseService.signOut();
      } finally {
        // The first auth event (typically INITIAL_SESSION) marks the service as initialized.
        if (!initialAuthEventProcessed) {
            initialAuthEventProcessed = true;
            this.resolveInitialized();
        }
      }
    });
  }
  
  private async setSessionAndProfile(session: Session | null, authoritativeProfile?: UserProfile | null) {
      if (!session) {
        // The session is null (user has signed out or session expired). Clear all state.
        this.session.set(null);
        this.currentUserRole.set(null);
        return;
      }

      // We have a session, so we need to validate the user's profile.
      const profile = authoritativeProfile || await this.supabaseService.getUserProfile(session.user.id);

      if (profile?.status === 'active' && profile.role && profile.role !== 'Unassigned') {
        // User has a valid session and a valid, active profile. Set the state.
        this.session.set(session);
        this.currentUserRole.set(profile.role);
      } else {
        // The user's profile is invalid (pending, unassigned, or missing).
        // A valid session with an invalid profile is not a permitted state.
        // We sign them out, which will trigger onAuthStateChange again with a null session.
        // That subsequent event will handle clearing the application state via the `!session` block above.
        await this.supabaseService.signOut();
      }
  }

  async signUp(email: string, password: string): Promise<User> {
    return this.supabaseService.signUp(email, password);
  }

  async signIn(email: string, password: string): Promise<Session> {
    try {
      const session = await this.supabaseService.signInWithPassword(email, password);
      
      // After successful login, fetch the user's profile.
      // The profile is now guaranteed to exist with the correct role/status by the DB trigger.
      const profile = await this.supabaseService.getUserProfile(session.user.id);
  
      if (!profile) {
        await this.supabaseService.signOut();
        throw new Error('User profile not found. The database trigger may have failed. Please contact an administrator.');
      }
      
      if (profile.status !== 'active') {
          await this.supabaseService.signOut();
          throw new Error('Your account is not active. Please contact an administrator.');
      }
      if (!profile.role || profile.role === 'Unassigned') {
          await this.supabaseService.signOut();
          throw new Error('Your account has not been assigned a role. Please contact an administrator.');
      }
  
      // Set the session with the authoritative profile.
      await this.setSessionAndProfile(session, profile);
  
      return session;
    } catch (error: any) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (errorMsg.includes('does not exist') || errorMsg.includes('could not find the table')) {
            this.runtimeError.set(error.message);
        }
        throw error; // Re-throw for component-level handling
    }
  }

  async signOut(): Promise<void> {
    return this.supabaseService.signOut();
  }
  
  async listAllUsers(): Promise<UserProfile[]> {
    return this.supabaseService.listUserProfiles();
  }

  async activateUser(user: UserProfile): Promise<UserProfile> {
      return this.supabaseService.updateUserProfile(user.id, { status: 'active' });
  }

  async updateUserRole(user: UserProfile, role: UserRole): Promise<UserProfile> {
    return this.supabaseService.updateUserProfile(user.id, { role: role });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.supabaseService.deleteUser(userId);
  }
}

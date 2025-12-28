
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

    this.supabaseService.getSession().then(async session => {
      try {
        // For the very first load, perform a full session evaluation.
        await this.setSessionAndProfile(session);
      } catch (error: any) {
        // Gracefully handle schema errors during initial load
        if (error.message?.includes('does not exist')) {
          this.initializationError.set(error.message);
        } else {
          this.initializationError.set('An unexpected error occurred while initializing the session.');
          console.error("AuthService Initialization Error:", error);
        }
        // Ensure no partial session state remains on error
        this.session.set(null);
        this.currentUserRole.set(null);
      } finally {
        // Always resolve the promise to prevent the app from getting stuck on the initial loading spinner.
        this.resolveInitialized();
      }
    });

    this.supabaseService.onAuthStateChange(async (event, session) => {
      // The signIn() method is the single source of truth for setting the session
      // and user role upon a successful login. It provides an authoritative profile.
      // To prevent a race condition where this listener might fetch a stale profile
      // from the database right after login, we will completely ignore the SIGNED_IN event.
      if (event === 'SIGNED_IN') {
        return;
      }
      
      // A TOKEN_REFRESHED event means the user is the same, but they have a new token.
      // We update the session object to reflect this new token, but crucially
      // preserve the existing user role to avoid incorrect UI shifts.
      if (event === 'TOKEN_REFRESHED' && session) {
        this.session.set(session); // Only update the session, not the role.
        return;
      }

      // For all other events (INITIAL_SESSION, SIGNED_OUT, USER_DELETED, etc.),
      // we perform a full session and profile evaluation.
      try {
        await this.setSessionAndProfile(session);
      } catch(error: any) {
        console.error('Error during auth state change, signing out.', error);
        // If profile becomes invalid, force a sign-out.
        // The signOut call will trigger this listener again with a null session, correctly clearing the UI.
        await this.supabaseService.signOut();
      }
    });
  }
  
  private async setSessionAndProfile(session: Session | null, authoritativeProfile?: UserProfile | null) {
      if (session) {
        // If an authoritative profile is provided (from signIn), it's the source of truth.
        // Otherwise, we must fetch it (for INITIAL_SESSION or other events).
        const profile = authoritativeProfile || await this.supabaseService.getUserProfile(session.user.id);

        if (profile?.status === 'active') {
            this.session.set(session);
            this.currentUserRole.set(profile.role);
        } else {
            // User is pending, not found, or otherwise invalid. Ensure they are signed out.
            await this.supabaseService.signOut();
            this.session.set(null);
            this.currentUserRole.set(null);
        }
      } else {
        // The session is null (user has signed out or session expired). Clear all state.
        this.session.set(null);
        this.currentUserRole.set(null);
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

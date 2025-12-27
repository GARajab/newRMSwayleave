
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '../models/wayleave.model';

export type AugmentedUser = User & { role: UserRole; status: 'active' | 'pending' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  session = signal<Session | null>(null);
  
  currentUserRole = signal<UserRole | null>(null);

  isInitialized: Promise<void>;
  private resolveInitialized!: () => void;

  constructor() {
    this.isInitialized = new Promise(resolve => {
        this.resolveInitialized = resolve;
    });

    this.supabaseService.getSession().then(async session => {
      await this.setSession(session);
      this.resolveInitialized();
    });

    this.supabaseService.onAuthStateChange(async (event, session) => {
      // The signIn() method calls setSession with an authoritative profile.
      // We MUST ignore the SIGNED_IN event here to prevent a race condition
      // where this listener calls setSession without a profile, potentially
      // fetching stale data from the database and overwriting the correct role.
      if (event === 'SIGNED_IN') {
        return;
      }
      // For all other events (INITIAL_SESSION, SIGNED_OUT, TOKEN_REFRESHED),
      // the setSession method can safely manage the application's state.
      await this.setSession(session);
    });
  }

  async setSession(session: Session | null, profile?: UserProfile | null) {
      if (session) {
        // Path 1: An explicit profile is provided (from our signIn method).
        // This is the source of truth during login.
        if (profile) {
            this.session.set(session);
            this.currentUserRole.set(profile.role);
            return;
        }

        // Path 2: A background event for an already-logged-in user (e.g., TOKEN_REFRESHED).
        // We only update the session object (which contains the new token) and preserve the existing role.
        if (this.session()?.user?.id === session.user.id) {
            this.session.set(session);
            return;
        }

        // Path 3: A new session for a user we haven't seen yet (e.g., INITIAL_SESSION on app load).
        // We must fetch their profile and validate their status.
        const userProfile = await this.supabaseService.getUserProfile(session.user.id);
        if (userProfile?.status === 'active') {
            this.session.set(session);
            this.currentUserRole.set(userProfile.role);
        } else {
            // User is pending, not found, or otherwise invalid. Ensure they are signed out.
            await this.supabaseService.signOut();
        }
      } else {
        // Path 4: The session is null (user has signed out). Clear all state.
        this.session.set(null);
        this.currentUserRole.set(null);
      }
  }
  
  async signUp(email: string, password: string): Promise<User> {
    return this.supabaseService.signUp(email, password);
  }

  async signIn(email: string, password: string): Promise<Session> {
    const session = await this.supabaseService.signInWithPassword(email, password);
    
    // After successful login, fetch the user's profile from our public.users table.
    let profile = await this.supabaseService.getUserProfile(session.user.id);

    // ONE-TIME BOOTSTRAP: If the designated admin logs in and has no profile, create it.
    // This seeds the first admin account, making them an active Admin.
    if (!profile && email === 'mohamed.rajab@ewa.bh') {
      console.log('Bootstrapping initial admin user...');
      const user = await this.supabaseService.listUsers().then(users => users.find(u => u.email === email));
      if (user) {
         profile = await this.supabaseService.updateUserProfile(user.id, {
            role: 'Admin',
            status: 'active'
         });
      }
    }

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

    // Explicitly call setSession here and pass the profile we just retrieved/created.
    // This provides the authoritative state for the user's session and role.
    await this.setSession(session, profile);

    return session;
  }

  async signOut(): Promise<void> {
    return this.supabaseService.signOut();
  }
  
  async listAllUsers(): Promise<AugmentedUser[]> {
    const [authUsers, profiles] = await Promise.all([
      this.supabaseService.listUsers(),
      this.supabaseService.listUserProfiles()
    ]);

    // FIX: Explicitly typing the Map helps TypeScript correctly infer the type of its values.
    // This ensures `profile` is correctly typed as `UserProfile | undefined` instead of `unknown`.
    const profilesMap = new Map<string, UserProfile>(profiles.map(p => [p.id, p]));

    return authUsers.map(user => {
      const profile = profilesMap.get(user.id);
      return {
        ...user,
        role: profile?.role || 'Unassigned',
        status: profile?.status || 'pending'
      };
    });
  }

  async activateUser(user: AugmentedUser): Promise<AugmentedUser> {
      const updatedProfile = await this.supabaseService.updateUserProfile(user.id, { status: 'active' });
      return { ...user, role: updatedProfile.role, status: updatedProfile.status };
  }

  async updateUserRole(user: AugmentedUser, role: UserRole): Promise<AugmentedUser> {
    const updatedProfile = await this.supabaseService.updateUserProfile(user.id, { role: role });
    return { ...user, role: updatedProfile.role, status: updatedProfile.status };
  }

  async deleteUser(userId: string): Promise<void> {
    return this.supabaseService.deleteUser(userId);
  }
}

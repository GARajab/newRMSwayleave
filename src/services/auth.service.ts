
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
      // After a user signs in, check their profile status.
      // If they are pending, log them out immediately.
      // This prevents users from using the app before an admin activates them.
      if (event === 'SIGNED_IN' && session) {
        const profile = await this.supabaseService.getUserProfile(session.user.id);
        if (profile?.status === 'pending') {
          this.supabaseService.signOut(); // This will trigger another auth change event to null the session.
          return;
        }
      }
      await this.setSession(session);
    });
  }

  async setSession(session: Session | null) {
      this.session.set(session);
      if (session?.user) {
        // Fetch role from the public.users table instead of app_metadata
        const profile = await this.supabaseService.getUserProfile(session.user.id);
        this.currentUserRole.set(profile?.role || 'Unassigned');
      } else {
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

    // Explicitly call setSession here to ensure the role is updated immediately after
    // the sign-in logic, especially after the admin bootstrap. This avoids a race condition
    // with the onAuthStateChange listener.
    await this.setSession(session);

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
}

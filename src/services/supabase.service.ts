
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel, Session, AuthChangeEvent, User } from '@supabase/supabase-js';
import { WayleaveRecord, HistoryEntry, WayleaveStatus, UserRole, UserProfile } from '../models/wayleave.model';

// This is a placeholder for the actual database schema type.
// For a real app, you would generate this from your Supabase schema.
type DbRecord = {
  id: number;
  created_at: string;
  wayleave_number: string;
  status: string;
  history: HistoryEntry[];
  attachment_name: string;
  attachment_path: string;
  attachment_size: number;
  approved_attachment_name: string | null;
  approved_attachment_path: string | null;
  approved_attachment_size: number | null;
};

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl = 'https://igdsslhrtlzvbjxelgyz.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZHNzbGhydGx6dmJqeGVsZ3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Nzc4MzYsImV4cCI6MjA4MjI1MzgzNn0.aBnlOyyDsz7NcGGIQhL6C3DMLh0ZmPVxO4p-0XyuCgk';
  private bucketName = 'wayleave-attachments';
  private channel: RealtimeChannel;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    this.channel = this.supabase.channel('wayleave_records');
  }

  // --- Auth Methods ---
  async signUp(email: string, password: string): Promise<User> {
    // The trigger on auth.users will create a corresponding public.users profile.
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed, no user returned.');
    return data.user;
  }

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Login failed, no session returned.');
    return data.session;
  }

  async signOut() {
    // Check if there is an active session before attempting to sign out
    const { data } = await this.supabase.auth.getSession();
    if (!data.session) {
      return;
    }

    const { error } = await this.supabase.auth.signOut();
    // Silently ignore errors during sign out (like 403 Forbidden) as the user is logging out anyway
    if (error) return;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = this.supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  }

  // --- Admin Auth Methods ---
  async deleteUser(userId: string): Promise<void> {
    // This performs a "soft delete" from the app's perspective by removing the profile.
    // The user will no longer be able to log in, as their profile will be missing,
    // and the auth service will reject the session. The user still exists in `auth.users`.
    // A full delete requires the service_role key and should be done in a secure environment.
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error(`Error deleting user profile ${userId}:`, error.message, error);
      throw error;
    }
  }

  // --- User Profile Methods ---
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, role, status, email, created_at')
      .eq('id', userId)
      .single();
    if (error) {
      // 'PGRST116' is the code for "exact one row not found". We can treat this as "not found".
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user profile:', error.message, error);
      throw error;
    }
    return data as UserProfile;
  }

  async listUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase.from('users').select('id, role, status, email, created_at');
    if (error) {
      console.error('Error fetching user profiles:', error.message, error);
      throw error;
    }
    return data as UserProfile[];
  }

  async updateUserProfile(userId: string, data: Partial<{ role: UserRole; status: string }>): Promise<UserProfile> {
    const { data: updatedData, error } = await this.supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error.message, error);
      throw error;
    }
    return updatedData as UserProfile;
  }

  // --- Data Methods ---
  private mapDbRecordToWayleaveRecord(dbRecord: DbRecord): WayleaveRecord {
    const record: WayleaveRecord = {
      id: dbRecord.id,
      wayleaveNumber: dbRecord.wayleave_number,
      status: dbRecord.status as WayleaveStatus,
      history: dbRecord.history.map(h => ({ ...h, timestamp: new Date(h.timestamp) })),
      attachment: {
        name: dbRecord.attachment_name,
        path: dbRecord.attachment_path,
        size: dbRecord.attachment_size
      }
    };
    if (dbRecord.approved_attachment_name && dbRecord.approved_attachment_path && dbRecord.approved_attachment_size) {
      record.approvedAttachment = {
        name: dbRecord.approved_attachment_name,
        path: dbRecord.approved_attachment_path,
        size: dbRecord.approved_attachment_size
      };
    }
    return record;
  }

  async getRecords(): Promise<WayleaveRecord[]> {
    const { data, error } = await this.supabase
      .from('wayleave_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error.message, error.details);
      throw error;
    }

    return data.map(this.mapDbRecordToWayleaveRecord);
  }

  listenToChanges(
    addRecord: (record: WayleaveRecord) => void,
    updateRecord: (record: WayleaveRecord) => void,
    deleteRecord: (id: number) => void
  ): void {
    this.channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'wayleave_records' },
      (payload) => {
        console.log('Real-time change received:', payload);
        switch (payload.eventType) {
          case 'INSERT':
            addRecord(this.mapDbRecordToWayleaveRecord(payload.new as DbRecord));
            break;
          case 'UPDATE':
            updateRecord(this.mapDbRecordToWayleaveRecord(payload.new as DbRecord));
            break;
          case 'DELETE':
            // The 'id' is in the 'old' part of the payload for deletes
            deleteRecord((payload.old as { id: number }).id);
            break;
        }
      }
    )
      .subscribe((status, err) => {
        if (err) {
          console.error('Real-time subscription error:', err.message, err);
        }
      });
  }

  private async uploadAttachment(file: File, wayleaveNumber: string): Promise<{ path: string }> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${wayleaveNumber}/${new Date().getTime()}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error.message, error);
      throw error;
    }
    return { path: filePath };
  }

  async addRecord(wayleaveNumber: string, attachment: File, actor: UserRole): Promise<void> {
    const { path } = await this.uploadAttachment(attachment, wayleaveNumber);

    const newHistoryEntry: HistoryEntry = {
      status: 'Waiting for TSS Action',
      timestamp: new Date(),
      actor: actor
    };

    const { error } = await this.supabase.from('wayleave_records').insert({
      wayleave_number: wayleaveNumber,
      status: 'Waiting for TSS Action',
      history: [newHistoryEntry],
      attachment_name: attachment.name,
      attachment_size: attachment.size,
      attachment_path: path
    });

    if (error) {
      console.error('Error adding record:', error.message, error);
      throw error;
    }
  }

  async updateStatus(recordId: number, newStatus: WayleaveStatus, actor: UserRole, approvedAttachmentFile?: File): Promise<void> {
    // Enforce mandatory attachment when approving (sending back to Planning)
    if (newStatus === 'Approved' && !approvedAttachmentFile) {
      throw new Error('Mandatory: Please attach the approved document before sending back to Planning.');
    }

    const { data: currentRecord, error: fetchError } = await this.supabase
      .from('wayleave_records')
      .select('history, wayleave_number')
      .eq('id', recordId)
      .single();

    if (fetchError || !currentRecord) {
      console.error('Error fetching record to update:', fetchError?.message, fetchError);
      throw fetchError || new Error('Record not found');
    }

    const newHistoryEntry: HistoryEntry = { status: newStatus, timestamp: new Date(), actor };
    const updatedHistory = [...currentRecord.history, newHistoryEntry];

    const updateData: Partial<DbRecord> = {
      status: newStatus,
      history: updatedHistory,
    };

    if (approvedAttachmentFile) {
      const { path } = await this.uploadAttachment(approvedAttachmentFile, currentRecord.wayleave_number);
      updateData.approved_attachment_name = approvedAttachmentFile.name;
      updateData.approved_attachment_size = approvedAttachmentFile.size;
      updateData.approved_attachment_path = path;
    }

    const { error: updateError } = await this.supabase
      .from('wayleave_records')
      .update(updateData)
      .eq('id', recordId);

    if (updateError) {
      console.error('Error updating status:', updateError.message, updateError);
      throw updateError;
    }
  }

  async updateRecordDetails(recordId: number, wayleaveNumber: string): Promise<void> {
    const { error } = await this.supabase
      .from('wayleave_records')
      .update({ wayleave_number: wayleaveNumber })
      .eq('id', recordId);

    if (error) {
      console.error('Error updating record details:', error.message, error);
      throw error;
    }
  }

  async deleteRecord(recordId: number): Promise<void> {
    // First, get the record to find the attachment paths
    const { data: record, error: fetchError } = await this.supabase
      .from('wayleave_records')
      .select('attachment_path, approved_attachment_path')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      console.error(`Error fetching record ${recordId} for deletion:`, fetchError.message);
      throw fetchError;
    }

    // Collect file paths to delete
    const filesToDelete: string[] = [];
    if (record.attachment_path) {
      filesToDelete.push(record.attachment_path);
    }
    if (record.approved_attachment_path) {
      filesToDelete.push(record.approved_attachment_path);
    }

    // Delete files from storage if they exist
    if (filesToDelete.length > 0) {
      const { error: storageError } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filesToDelete);

      if (storageError) {
        // Log the error but proceed to delete the DB record anyway,
        // as orphaned files are less critical than a failed deletion.
        console.error(`Could not delete attachments for record ${recordId}:`, storageError.message);
      }
    }

    // Finally, delete the record from the database
    const { error: deleteError } = await this.supabase
      .from('wayleave_records')
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      console.error(`Error deleting record ${recordId}:`, deleteError.message);
      throw deleteError;
    }
  }

  async getAttachmentUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, 60);

    if (error) {
      console.error('Error creating signed URL:', error.message, error);
      throw error;
    }
    return data.signedUrl;
  }
}

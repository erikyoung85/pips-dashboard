import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../database.types';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = environment.supabase.url;
    const supabasePublishableKey = environment.supabase.publishableKey;

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error(
        'Supabase URL and Publishable Key must be provided in environment variables.',
      );
    }

    try {
      this.supabase = createClient(supabaseUrl, supabasePublishableKey);
    } catch {
      throw new Error(
        'Failed to create Supabase client. Please check your Supabase URL and Anon Key.',
      );
    }
  }

  get client() {
    return this.supabase;
  }
}

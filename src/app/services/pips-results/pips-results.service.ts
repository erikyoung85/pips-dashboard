import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../../../../database.types';

export type PipsResult = Pick<
  Tables<'pips_result'>,
  'pips_number' | 'duration_seconds' | 'sender_phone_number'
>;

@Injectable({ providedIn: 'root' })
export class PipsResultsService {
  private readonly supabase = inject(SupabaseService);

  async getAll(): Promise<PipsResult[]> {
    const { data, error } = await this.supabase.client
      .from('pips_result')
      .select('pips_number, duration_seconds, sender_phone_number')
      .order('pips_number', { ascending: false });
    if (error) throw new Error(`Failed to fetch pips results: ${error.message}`);
    return data ?? [];
  }
}

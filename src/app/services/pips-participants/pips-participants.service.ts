import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../../../../database.types';

export type PipsParticipant = Pick<
  Tables<'pips_participant'>,
  'name' | 'phone_number'
>;

@Injectable({ providedIn: 'root' })
export class PipsParticipantsService {
  private readonly supabase = inject(SupabaseService);

  async getAll(): Promise<PipsParticipant[]> {
    const { data, error } = await this.supabase.client
      .from('pips_participant')
      .select('name, phone_number');
    if (error) throw new Error(`Failed to fetch pips participants: ${error.message}`);
    return data ?? [];
  }
}

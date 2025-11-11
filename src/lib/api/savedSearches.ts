import { supabase } from '@/integrations/supabase/client';
import { JobFilters } from '@/types/jobs';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: JobFilters;
  created_at: string;
  updated_at: string;
}

export const savedSearchesApi = {
  async getAll(): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SavedSearch[];
  },

  async create(name: string, filters: JobFilters): Promise<SavedSearch> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_searches')
      .insert([{ 
        name, 
        filters: filters as any,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as SavedSearch;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

import { supabase } from "@/integrations/supabase/client";

export interface MaterialsUsage {
  id?: string;
  user_id?: string;
  job_id: string;
  resume_id?: string | null;
  cover_letter_id?: string | null;
  resume_version_name?: string | null;
  cover_letter_version_name?: string | null;
  used_at?: string;
  notes?: string | null;
}

export const materialsUsageApi = {
  async getAll(jobId?: string) {
    let query = supabase
      .from('materials_usage')
      .select('*')
      .order('used_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(usage: MaterialsUsage) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('materials_usage')
      .insert({
        ...usage,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMonthlyStats(userId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('materials_usage')
      .select('used_at')
      .eq('user_id', userId)
      .gte('used_at', startDate.toISOString());

    if (error) throw error;
    return data || [];
  },
};

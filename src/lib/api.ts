import { supabase } from '@/integrations/supabase/client';

// Supabase-based API client
export const api = {
  // Jobs management
  jobs: {
    getAll: async (filters?: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    get: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (jobData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...jobData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id: string, jobData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },

    archive: async (id: string, reason?: string) => {
      return api.jobs.update(id, { is_archived: true, archive_reason: reason });
    },

    unarchive: async (id: string) => {
      return api.jobs.update(id, { is_archived: false, archive_reason: null });
    },

    updateStatus: async (id: string, status: string) => {
      const job = await api.jobs.get(id);
      const statusHistory = (job.status_history || []) as Array<any>;
      statusHistory.push({
        status,
        changedAt: new Date().toISOString(),
      });
      return api.jobs.update(id, { 
        status, 
        status_history: statusHistory,
        status_updated_at: new Date().toISOString()
      });
    },

    getStats: async () => {
      const jobs = await api.jobs.getAll();
      
      const byStatus = {
        interested: jobs.filter(j => j.status === 'interested').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        phoneScreen: jobs.filter(j => j.status === 'phone_screen').length,
        interview: jobs.filter(j => j.status === 'interview').length,
        offer: jobs.filter(j => j.status === 'offer').length,
        rejected: jobs.filter(j => j.status === 'rejected').length,
      };

      const upcomingDeadlines = jobs
        .filter(j => j.application_deadline && !j.is_archived)
        .map(j => ({
          jobId: j.id,
          jobTitle: j.job_title,
          company: j.company_name,
          deadline: j.application_deadline,
          daysUntil: Math.ceil((new Date(j.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }))
        .filter(j => j.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      return {
        total: jobs.length,
        byStatus,
        upcomingDeadlines
      };
    },
  },

  // Resume management
  resumes: {
    getAll: async (isArchived?: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id);

      if (isArchived !== undefined) {
        query = query.eq('is_archived', isArchived);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    get: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (resumeData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resumes')
        .insert({ ...resumeData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id: string, resumeData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resumes')
        .update(resumeData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },

    generateContent: async (resumeId: string, jobId: string, sections: string[]) => {
      const { data, error } = await supabase.functions.invoke('ai-resume-content', {
        body: { jobId, sections }
      });

      if (error) throw error;
      return data;
    },

    optimizeSkills: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-optimize-skills', {
        body: { jobId }
      });

      if (error) throw error;
      return data;
    },

    tailorExperience: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-tailor-experience', {
        body: { jobId }
      });

      if (error) throw error;
      return data;
    },
  },

  // Cover letter management
  coverLetters: {
    getAll: async (isArchived?: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id);

      if (isArchived !== undefined) {
        query = query.eq('is_archived', isArchived);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    get: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (coverLetterData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cover_letters')
        .insert({ ...coverLetterData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id: string, coverLetterData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cover_letters')
        .update(coverLetterData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cover_letters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },

    generate: async (jobId: string, tone?: string, template?: string) => {
      const { data, error } = await supabase.functions.invoke('ai-cover-letter', {
        body: { jobId, tone: tone || 'professional', template: template || 'formal' }
      });

      if (error) throw error;
      return data;
    },
  },

  // Company research
  company: {
    research: async (companyName: string, companyWebsite?: string) => {
      const { data, error } = await supabase.functions.invoke('ai-company-research', {
        body: { companyName, companyWebsite }
      });

      if (error) throw error;
      return data;
    },
  },

  // Job matching
  matching: {
    analyzeJob: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-job-match', {
        body: { jobId }
      });

      if (error) throw error;
      return data;
    },
  },

  // Job import from URL
  jobImport: {
    fromUrl: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('ai-job-import', {
        body: { url }
      });

      if (error) throw error;
      return data;
    },
  },

  // Profile management
  profile: {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },

    update: async (profileData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },
};

// Legacy backend API client - kept for profile management only
// Note: Job, Resume, and Cover Letter management now use direct Supabase API above

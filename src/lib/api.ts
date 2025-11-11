import { supabase } from '@/integrations/supabase/client';
import { savedSearchesApi } from './api/savedSearches';
import { materialsUsageApi } from './api/materialsUsage';

// Supabase-based API client
export const api = {
  auth: {
    getUser: async () => {
      return await supabase.auth.getUser();
    },
  },
  // Jobs management
  jobs: {
    getAll: async (filters?: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);

      // Text search on job_title OR company_name (case-insensitive, partial match)
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`job_title.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
      }

      // Status filter (single value)
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Salary range filters
      if (filters?.salaryMin !== undefined) {
        query = query.gte('salary_max', filters.salaryMin);
      }
      if (filters?.salaryMax !== undefined) {
        query = query.lte('salary_min', filters.salaryMax);
      }

      // Deadline range filters
      if (filters?.deadlineFrom) {
        query = query.gte('application_deadline', filters.deadlineFrom);
      }
      if (filters?.deadlineTo) {
        query = query.lte('application_deadline', filters.deadlineTo);
      }

      // Archive filter
      if (filters?.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived);
      }

      // Sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

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
        body: { jobId, sections, returnFormat: 'structured' }
      });

      if (error) throw error;
      
      // Transform the structured response into the format expected by ResumeBuilder
      if (sections.length > 1) {
        return {
          summary: data.summary || [],
          experience: data.experience || [],
          skills: data.skills || []
        };
      }
      
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

    generate: async (jobId: string, tone?: string, template?: string, researchContext?: string) => {
      const { data, error } = await supabase.functions.invoke('ai-cover-letter-generate', {
        body: { jobId, tone: tone || 'professional', template: template || 'formal', researchContext }
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

  materialsUsage: {
    async listByJob(jobId: string) {
      const { data, error } = await supabase
        .from('materials_usage')
        .select('*')
        .eq('job_id', jobId)
        .order('used_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async add(params: {
      jobId: string;
      resumeId?: string | null;
      coverLetterId?: string | null;
      notes?: string | null;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('materials_usage')
        .insert({
          user_id: user.id,
          job_id: params.jobId,
          resume_id: params.resumeId ?? null,
          cover_letter_id: params.coverLetterId ?? null,
          notes: params.notes ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data!;
    },

    async usageByMonth({ months = 6 }: { months?: number } = {}) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const { data, error } = await supabase
        .from('materials_usage')
        .select('used_at')
        .eq('user_id', user.id)
        .gte('used_at', since.toISOString());
      if (error) throw error;
      
      // Aggregate in client
      const buckets = new Map<string, number>();
      data?.forEach(({ used_at }) => {
        const d = new Date(used_at);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      });
      return Array.from(buckets.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, count]) => ({ month, count }));
    },
  },
};

// Legacy backend API client - kept for profile management only
// Note: Job, Resume, and Cover Letter management now use direct Supabase API above

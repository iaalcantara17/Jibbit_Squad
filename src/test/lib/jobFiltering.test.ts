import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Job Filtering', () => {
  const mockUser = { id: 'user-123' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Search', () => {
    it('should filter jobs by job_title (case-insensitive, partial match)', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ search: 'Software Engineer' });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'job_title.ilike.%Software Engineer%,company_name.ilike.%Software Engineer%'
      );
    });

    it('should filter jobs by company_name (case-insensitive, partial match)', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ search: 'Google' });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'job_title.ilike.%Google%,company_name.ilike.%Google%'
      );
    });

    it('should not show non-matching jobs when searching', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: '1', job_title: 'Software Development Engineering Intern', company_name: 'Amazon' },
          ],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await api.jobs.getAll({ search: 'Software Development Engineering Intern' });

      expect(result).toHaveLength(1);
      expect(result[0].job_title).toBe('Software Development Engineering Intern');
    });
  });

  describe('Combined Filters', () => {
    it('should combine status + salaryMin + salaryMax filters', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({
        status: 'applied',
        salaryMin: 80000,
        salaryMax: 150000,
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'applied');
      expect(mockQuery.gte).toHaveBeenCalledWith('salary_max', 80000);
      expect(mockQuery.lte).toHaveBeenCalledWith('salary_min', 150000);
    });

    it('should combine search + status + deadline range filters', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({
        search: 'Engineer',
        status: 'applied',
        deadlineFrom: '2024-01-01',
        deadlineTo: '2024-12-31',
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'job_title.ilike.%Engineer%,company_name.ilike.%Engineer%'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'applied');
      expect(mockQuery.gte).toHaveBeenCalledWith('application_deadline', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('application_deadline', '2024-12-31');
    });

    it('should handle all filters combined', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({
        search: 'Software',
        status: 'applied',
        salaryMin: 100000,
        salaryMax: 200000,
        deadlineFrom: '2024-01-01',
        deadlineTo: '2024-12-31',
        isArchived: false,
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'job_title.ilike.%Software%,company_name.ilike.%Software%'
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'applied');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_archived', false);
      expect(mockQuery.gte).toHaveBeenCalledWith('salary_max', 100000);
      expect(mockQuery.lte).toHaveBeenCalledWith('salary_min', 200000);
      expect(mockQuery.gte).toHaveBeenCalledWith('application_deadline', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('application_deadline', '2024-12-31');
    });
  });

  describe('Salary Range Filtering', () => {
    it('should filter by minimum salary', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ salaryMin: 80000 });

      expect(mockQuery.gte).toHaveBeenCalledWith('salary_max', 80000);
    });

    it('should filter by maximum salary', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ salaryMax: 150000 });

      expect(mockQuery.lte).toHaveBeenCalledWith('salary_min', 150000);
    });
  });

  describe('Deadline Range Filtering', () => {
    it('should filter by deadline start date', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ deadlineFrom: '2024-01-01' });

      expect(mockQuery.gte).toHaveBeenCalledWith('application_deadline', '2024-01-01');
    });

    it('should filter by deadline end date', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ deadlineTo: '2024-12-31' });

      expect(mockQuery.lte).toHaveBeenCalledWith('application_deadline', '2024-12-31');
    });
  });

  describe('Sorting', () => {
    it('should sort by created_at desc by default', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({});

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should sort by custom field ascending', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await api.jobs.getAll({ sortBy: 'job_title', sortOrder: 'asc' });

      expect(mockQuery.order).toHaveBeenCalledWith('job_title', { ascending: true });
    });
  });
});

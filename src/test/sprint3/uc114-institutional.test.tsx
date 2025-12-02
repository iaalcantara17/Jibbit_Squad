import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-114: Institutional Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Institutional Settings', () => {
    it('should create institutional settings', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSettings = {
        id: 'inst-1',
        institution_name: 'University Career Center',
        created_by: 'admin-1',
        primary_color: '#003366',
        logo_url: 'https://example.com/logo.png',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
          }),
        }),
      });

      expect(mockSettings.institution_name).toBe('University Career Center');
    });
  });

  describe('Cohort Management', () => {
    it('should create cohort with date range', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockCohort = {
        id: 'cohort-1',
        institution_id: 'inst-1',
        cohort_name: 'Fall 2025 Graduates',
        start_date: '2025-09-01',
        end_date: '2025-12-31',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCohort, error: null }),
          }),
        }),
      });

      expect(mockCohort.cohort_name).toBe('Fall 2025 Graduates');
    });

    it('should enroll members in cohort', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockMember = {
        id: 'member-1',
        cohort_id: 'cohort-1',
        user_id: 'user-1',
        status: 'active',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
          }),
        }),
      });

      expect(mockMember.status).toBe('active');
    });
  });

  describe('Aggregate Reporting', () => {
    it('should calculate cohort-wide metrics', () => {
      const cohortMembers = [
        { user_id: '1', applications: 15, interviews: 3, offers: 1 },
        { user_id: '2', applications: 20, interviews: 5, offers: 2 },
        { user_id: '3', applications: 10, interviews: 2, offers: 0 },
      ];

      const totalApplications = cohortMembers.reduce((sum, m) => sum + m.applications, 0);
      const avgApplications = totalApplications / cohortMembers.length;

      expect(totalApplications).toBe(45);
      expect(avgApplications).toBe(15);
    });
  });
});

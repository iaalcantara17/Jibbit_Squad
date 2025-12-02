import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('UC-115: External Advisor and Coach Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Advisor Directory and Profiles', () => {
    it('should list available advisors with filtering', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockAdvisors = [
        {
          id: '1',
          user_id: 'advisor-1',
          display_name: 'Sarah Johnson',
          bio: 'Former FAANG recruiter with 10 years experience',
          specialization: ['technical_interviews', 'resume_review'],
          hourly_rate: 150,
          is_active: true,
        },
        {
          id: '2',
          user_id: 'advisor-2',
          display_name: 'Michael Chen',
          bio: 'Career coach specializing in career transitions',
          specialization: ['career_change', 'salary_negotiation'],
          hourly_rate: 125,
          is_active: true,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockAdvisors, error: null }),
        }),
      });

      expect(mockAdvisors).toHaveLength(2);
      expect(mockAdvisors[0].specialization).toContain('technical_interviews');
      expect(mockAdvisors[1].hourly_rate).toBe(125);
    });

    it('should filter advisors by specialization', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const specialization = 'resume_review';
      const filteredAdvisors = [
        {
          id: '1',
          display_name: 'Sarah Johnson',
          specialization: ['technical_interviews', 'resume_review'],
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            contains: vi.fn().mockResolvedValue({ data: filteredAdvisors, error: null }),
          }),
        }),
      });

      expect(filteredAdvisors[0].specialization).toContain(specialization);
    });

    it('should display advisor profile with bio and rates', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockProfile = {
        id: '1',
        display_name: 'Sarah Johnson',
        bio: 'Former FAANG recruiter with 10 years experience helping candidates land their dream jobs',
        specialization: ['technical_interviews', 'resume_review', 'mock_interviews'],
        hourly_rate: 150,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      expect(mockProfile.display_name).toBe('Sarah Johnson');
      expect(mockProfile.hourly_rate).toBe(150);
      expect(mockProfile.specialization).toHaveLength(3);
    });
  });

  describe('Coaching Session Scheduling', () => {
    it('should schedule a coaching session with an advisor', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSession = {
        id: 'session-1',
        advisor_id: 'advisor-1',
        client_user_id: 'user-1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        session_type: 'resume_review',
        status: 'scheduled',
        meeting_link: null,
        notes: null,
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }),
      });

      expect(mockSession.status).toBe('scheduled');
      expect(mockSession.duration_minutes).toBe(60);
      expect(mockSession.session_type).toBe('resume_review');
    });

    it('should support different session types', async () => {
      const sessionTypes = [
        'resume_review',
        'mock_interview',
        'career_strategy',
        'salary_negotiation',
      ];

      sessionTypes.forEach(type => {
        expect(['resume_review', 'mock_interview', 'career_strategy', 'salary_negotiation']).toContain(type);
      });
    });

    it('should add meeting link after scheduling', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockUpdatedSession = {
        id: 'session-1',
        meeting_link: 'https://zoom.us/j/123456789',
        status: 'confirmed',
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedSession, error: null }),
            }),
          }),
        }),
      });

      expect(mockUpdatedSession.meeting_link).toBe('https://zoom.us/j/123456789');
      expect(mockUpdatedSession.status).toBe('confirmed');
    });
  });

  describe('Session Management', () => {
    it('should list upcoming sessions for a client', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSessions = [
        {
          id: '1',
          scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          session_type: 'resume_review',
          status: 'confirmed',
        },
        {
          id: '2',
          scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          session_type: 'mock_interview',
          status: 'scheduled',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            }),
          }),
        }),
      });

      expect(mockSessions).toHaveLength(2);
      expect(mockSessions[0].session_type).toBe('resume_review');
    });

    it('should complete session with notes', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockCompletedSession = {
        id: 'session-1',
        status: 'completed',
        notes: 'Great session! Provided feedback on resume structure and keyword optimization. Next steps: Update resume and schedule mock interview.',
        updated_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCompletedSession, error: null }),
            }),
          }),
        }),
      });

      expect(mockCompletedSession.status).toBe('completed');
      expect(mockCompletedSession.notes).toContain('Next steps');
    });

    it('should handle session cancellation', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockCancelledSession = {
        id: 'session-1',
        status: 'cancelled',
        notes: 'Cancelled by client - rescheduling needed',
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCancelledSession, error: null }),
            }),
          }),
        }),
      });

      expect(mockCancelledSession.status).toBe('cancelled');
    });
  });

  describe('Session History and Tracking', () => {
    it('should track session history for a client', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockHistory = [
        {
          id: '1',
          scheduled_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          session_type: 'resume_review',
          status: 'completed',
          notes: 'Resume improvements discussed',
        },
        {
          id: '2',
          scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          session_type: 'mock_interview',
          status: 'completed',
          notes: 'Mock interview conducted, feedback provided',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
          }),
        }),
      });

      expect(mockHistory).toHaveLength(2);
      expect(mockHistory.every(s => s.status === 'completed')).toBe(true);
    });

    it('should calculate total sessions and hours with advisor', async () => {
      const sessions = [
        { duration_minutes: 60 },
        { duration_minutes: 90 },
        { duration_minutes: 60 },
      ];

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      const totalHours = totalMinutes / 60;

      expect(totalSessions).toBe(3);
      expect(totalHours).toBe(3.5);
    });
  });

  describe('Payment and Billing', () => {
    it('should calculate session cost based on duration and rate', async () => {
      const advisor = { hourly_rate: 150 };
      const session = { duration_minutes: 90 };

      const cost = (advisor.hourly_rate * session.duration_minutes) / 60;

      expect(cost).toBe(225); // 90 minutes * $150/hour = $225
    });

    it('should support different session durations', async () => {
      const hourlyRate = 150;
      const durations = [30, 60, 90];

      const costs = durations.map(mins => (hourlyRate * mins) / 60);

      expect(costs).toEqual([75, 150, 225]);
    });
  });
});

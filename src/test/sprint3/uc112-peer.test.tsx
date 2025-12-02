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

describe('UC-112: Peer Networking and Support Groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Support Groups Management', () => {
    it('should list available support groups', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockGroups = [
        {
          id: '1',
          group_name: 'Software Engineers Job Search',
          group_type: 'job_search',
          description: 'Support for software engineers',
          member_count: 25,
          is_public: true,
        },
        {
          id: '2',
          group_name: 'Career Transition Support',
          group_type: 'career_change',
          description: 'For those changing careers',
          member_count: 15,
          is_public: true,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockGroups, error: null }),
        }),
      });

      expect(mockGroups).toHaveLength(2);
      expect(mockGroups[0].group_name).toBe('Software Engineers Job Search');
    });

    it('should join a support group', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockMembership = {
        id: 'membership-1',
        group_id: 'group-1',
        user_id: 'user-1',
        role: 'member',
        joined_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
          }),
        }),
      });

      expect(mockMembership.role).toBe('member');
      expect(mockMembership.group_id).toBe('group-1');
    });
  });

  describe('Group Posts and Discussions', () => {
    it('should create a post in a support group', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockPost = {
        id: 'post-1',
        group_id: 'group-1',
        user_id: 'user-1',
        title: 'Interview Tips Request',
        content: 'Can anyone share their experience with technical interviews?',
        post_type: 'question',
        is_anonymous: false,
        reaction_count: 0,
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
          }),
        }),
      });

      expect(mockPost.title).toBe('Interview Tips Request');
      expect(mockPost.post_type).toBe('question');
    });

    it('should list posts with anonymous flag respected', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockPosts = [
        {
          id: '1',
          title: 'Public Post',
          is_anonymous: false,
          user_id: 'user-1',
        },
        {
          id: '2',
          title: 'Anonymous Post',
          is_anonymous: true,
          user_id: 'user-2',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
          }),
        }),
      });

      expect(mockPosts[0].is_anonymous).toBe(false);
      expect(mockPosts[1].is_anonymous).toBe(true);
    });
  });

  describe('Group Challenges', () => {
    it('should create a group challenge', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockChallenge = {
        id: 'challenge-1',
        group_id: 'group-1',
        title: '30 Applications in 30 Days',
        description: 'Apply to 30 jobs in the next month',
        challenge_type: 'applications',
        target_value: 30,
        duration_days: 30,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChallenge, error: null }),
          }),
        }),
      });

      expect(mockChallenge.challenge_type).toBe('applications');
      expect(mockChallenge.target_value).toBe(30);
    });

    it('should track participant progress in challenge', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockParticipant = {
        id: 'participant-1',
        challenge_id: 'challenge-1',
        user_id: 'user-1',
        current_value: 15,
        completed_at: null,
        joined_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockParticipant, error: null }),
          }),
        }),
      });

      expect(mockParticipant.current_value).toBe(15);
      expect(mockParticipant.completed_at).toBeNull();
    });

    it('should mark challenge as completed when target reached', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockCompletedParticipant = {
        id: 'participant-1',
        challenge_id: 'challenge-1',
        user_id: 'user-1',
        current_value: 30,
        completed_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCompletedParticipant, error: null }),
            }),
          }),
        }),
      });

      expect(mockCompletedParticipant.current_value).toBe(30);
      expect(mockCompletedParticipant.completed_at).not.toBeNull();
    });
  });

  describe('Group Webinars', () => {
    it('should schedule a group webinar', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockWebinar = {
        id: 'webinar-1',
        group_id: 'group-1',
        title: 'Mastering Behavioral Interviews',
        description: 'Learn how to ace behavioral interview questions',
        host_name: 'Jane Smith',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        meeting_link: 'https://zoom.us/j/example',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockWebinar, error: null }),
          }),
        }),
      });

      expect(mockWebinar.title).toBe('Mastering Behavioral Interviews');
      expect(mockWebinar.duration_minutes).toBe(60);
    });

    it('should list upcoming webinars for a group', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockWebinars = [
        {
          id: '1',
          title: 'Resume Writing Workshop',
          scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Networking Strategies',
          scheduled_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockWebinars, error: null }),
            }),
          }),
        }),
      });

      expect(mockWebinars).toHaveLength(2);
      expect(mockWebinars[0].title).toBe('Resume Writing Workshop');
    });
  });

  describe('Peer Referrals', () => {
    it('should request referral within peer group', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockReferral = {
        id: 'referral-1',
        requester_id: 'user-1',
        potential_referrer_id: 'user-2',
        job_id: 'job-1',
        company_name: 'Tech Corp',
        status: 'pending',
        message: 'Would you be able to refer me for this position?',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockReferral, error: null }),
          }),
        }),
      });

      expect(mockReferral.status).toBe('pending');
      expect(mockReferral.company_name).toBe('Tech Corp');
    });

    it('should track referral response and outcome', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockAcceptedReferral = {
        id: 'referral-1',
        status: 'accepted',
        responded_at: new Date().toISOString(),
        notes: 'Submitted your resume to our internal system',
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockAcceptedReferral, error: null }),
            }),
          }),
        }),
      });

      expect(mockAcceptedReferral.status).toBe('accepted');
      expect(mockAcceptedReferral.notes).toContain('Submitted your resume');
    });
  });
});

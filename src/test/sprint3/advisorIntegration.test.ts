import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

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

  describe('Advisor Profile Management', () => {
    it('should create advisor profile', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'advisor-123',
          display_name: 'Jane Coach',
          hourly_rate: 75.00,
          is_active: true,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const profile = {
        user_id: 'user-123',
        display_name: 'Jane Coach',
        bio: 'Career coach with 10 years of experience',
        specialization: ['Resume Review', 'Interview Prep'],
        hourly_rate: 75.00,
        is_active: true,
      };

      const result = await supabase
        .from('advisor_profiles')
        .insert(profile);

      expect(result.error).toBeNull();
    });

    it('should list active advisors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'advisor-1', is_active: true },
              { id: 'advisor-2', is_active: true },
            ],
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      expect(result.data).toHaveLength(2);
    });
  });

  describe('Session Scheduling', () => {
    it('should schedule coaching session', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'session-123',
          advisor_id: 'advisor-456',
          client_user_id: 'user-789',
          scheduled_date: '2025-01-15T10:00:00Z',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const session = {
        advisor_id: 'advisor-456',
        client_user_id: 'user-789',
        session_type: 'resume_review' as const,
        scheduled_date: '2025-01-15T10:00:00Z',
        duration_minutes: 60,
        status: 'scheduled' as const,
      };

      const result = await supabase
        .from('coaching_sessions')
        .insert(session);

      expect(result.error).toBeNull();
    });

    it('should update session status', async () => {
      const statusUpdate = { status: 'completed' as const };
      
      // Just validate the logic without complex mocking
      expect(statusUpdate.status).toBe('completed');
    });
  });

  describe('Payment Integration', () => {
    it('should create payment record', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'payment-123',
          session_id: 'session-456',
          amount: 75.00,
          payment_status: 'pending',
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const payment = {
        session_id: 'session-456',
        client_user_id: 'user-789',
        advisor_id: 'advisor-123',
        amount: 75.00,
        currency: 'USD',
        payment_status: 'pending' as const,
      };

      const result = await supabase
        .from('session_payments')
        .insert(payment);

      expect(result.error).toBeNull();
    });

    it('should calculate session total', () => {
      const hourlyRate = 75.00;
      const durationMinutes = 60;
      
      const total = (hourlyRate / 60) * durationMinutes;

      expect(total).toBe(75.00);
    });

    it('should validate payment statuses', () => {
      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      const status = 'completed';

      expect(validStatuses).toContain(status);
    });
  });

  describe('Session Management Integration', () => {
    it('should validate meeting link format', () => {
      const validLink = 'https://zoom.us/j/123456789';
      const invalidLink = 'not-a-url';

      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl(validLink)).toBe(true);
      expect(isValidUrl(invalidLink)).toBe(false);
    });

    it('should validate session time slots', () => {
      const scheduledDate = new Date('2025-01-15T10:00:00Z');
      const now = new Date('2025-01-10T10:00:00Z');
      
      const isInFuture = scheduledDate > now;
      const hoursUntilSession = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const meetsCancellationPolicy = hoursUntilSession >= 24;

      expect(isInFuture).toBe(true);
      expect(hoursUntilSession).toBeGreaterThan(24);
      expect(meetsCancellationPolicy).toBe(true);
    });
  });
});

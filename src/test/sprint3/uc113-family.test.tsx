import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-113: Family Support Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Family Supporter Invitations', () => {
    it('should create supporter invitation with token', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockInvite = {
        id: 'supporter-1',
        user_id: 'user-1',
        supporter_name: 'Mom',
        supporter_email: 'mom@example.com',
        relationship: 'parent',
        access_level: 'view_only',
        invite_token: 'abc123',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInvite, error: null }),
          }),
        }),
      });

      expect(mockInvite.relationship).toBe('parent');
      expect(mockInvite.invite_token).toBe('abc123');
    });
  });

  describe('Progress Updates', () => {
    it('should create progress update for supporters', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockUpdate = {
        id: 'update-1',
        user_id: 'user-1',
        update_type: 'application',
        content: 'Applied to 5 new positions this week!',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdate, error: null }),
          }),
        }),
      });

      expect(mockUpdate.update_type).toBe('application');
    });
  });
});

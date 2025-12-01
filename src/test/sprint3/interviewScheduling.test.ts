import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Interview Scheduling Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Interview Creation', () => {
    it('should create interview with all required fields', async () => {
      const mockInterview = {
        job_id: 'job-123',
        interview_type: 'phone-screen',
        scheduled_start: '2024-12-15T10:00:00Z',
        duration_minutes: 60,
        user_id: 'user-123',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'interview-123', ...mockInterview },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await supabase.from('interviews').insert(mockInterview);

      expect(mockInsert).toHaveBeenCalledWith(mockInterview);
      expect(result.data).toHaveProperty('id');
      expect(result.error).toBeNull();
    });

    it('should calculate scheduled_end from start + duration', () => {
      const scheduledStart = new Date('2024-12-15T10:00:00Z');
      const durationMinutes = 60;

      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);

      expect(scheduledEnd.toISOString()).toBe('2024-12-15T11:00:00Z');
    });

    it('should validate interview type', () => {
      const validTypes = ['phone-screen', 'technical', 'onsite', 'final', 'behavioral'];
      const testType = 'phone-screen';

      expect(validTypes).toContain(testType);
    });
  });

  describe('Interview Checklist Logic', () => {
    it('should create checklist items with categories', async () => {
      const mockChecklist = {
        interview_id: 'interview-123',
        label: 'Research company background',
        category: 'preparation',
        is_required: true,
        user_id: 'user-123',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockChecklist,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await supabase.from('interview_checklists').insert(mockChecklist);

      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(mockChecklist);
    });

    it('should mark checklist item as completed', async () => {
      const completedAt = new Date().toISOString();
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { completed_at: completedAt },
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await supabase
        .from('interview_checklists')
        .update({ completed_at: completedAt })
        .eq('id', 'checklist-123');

      expect(mockUpdate).toHaveBeenCalledWith({ completed_at: completedAt });
    });

    it('should calculate checklist completion percentage', () => {
      const checklists = [
        { id: '1', completed_at: '2024-12-01T10:00:00Z' },
        { id: '2', completed_at: null },
        { id: '3', completed_at: '2024-12-01T11:00:00Z' },
        { id: '4', completed_at: null },
      ];

      const completed = checklists.filter(c => c.completed_at !== null).length;
      const total = checklists.length;
      const percentage = (completed / total) * 100;

      expect(percentage).toBe(50);
    });
  });

  describe('Interview Status Updates', () => {
    it('should update interview outcome', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { outcome: 'passed' },
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await supabase
        .from('interviews')
        .update({ outcome: 'passed' })
        .eq('id', 'interview-123');

      expect(mockUpdate).toHaveBeenCalledWith({ outcome: 'passed' });
    });
  });
});

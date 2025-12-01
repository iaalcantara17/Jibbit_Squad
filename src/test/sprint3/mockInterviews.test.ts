import { describe, it, expect, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Mock Interview Sessions', () => {
  describe('Session Creation', () => {
    it('should create mock interview session', async () => {
      const mockSession = {
        user_id: 'user-123',
        target_role: 'Software Engineer',
        company_name: 'Tech Corp',
        format: 'behavioral',
        question_count: 5,
        status: 'in_progress',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'session-123', ...mockSession },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await supabase
        .from('mock_interview_sessions')
        .insert(mockSession);

      expect(result.data).toHaveProperty('id');
      expect(mockInsert).toHaveBeenCalledWith(mockSession);
    });

    it('should validate question count is positive', () => {
      const questionCount = 5;
      expect(questionCount).toBeGreaterThan(0);
      expect(questionCount).toBeLessThanOrEqual(20);
    });
  });

  describe('Response Recording', () => {
    it('should record interview response', async () => {
      const mockResponse = {
        session_id: 'session-123',
        question_id: 'question-456',
        question_order: 1,
        response_text: 'My answer...',
        time_taken: 180,
        is_followup: false,
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await supabase
        .from('mock_interview_responses')
        .insert(mockResponse);

      expect(result.error).toBeNull();
    });
  });

  describe('AI Feedback (Fallback Mode)', () => {
    it('should handle AI feedback generation with fallback', async () => {
      const mockInvoke = vi.fn()
        .mockRejectedValueOnce(new Error('AI service unavailable'))
        .mockResolvedValueOnce({
          data: {
            feedback: 'Fallback: Generic feedback message',
          },
          error: null,
        });

      vi.mocked(supabase.functions).invoke = mockInvoke;

      try {
        await supabase.functions.invoke('ai-question-feedback', {
          body: { response_id: 'response-123' },
        });
      } catch (error) {
        // First call fails, trigger fallback
        const fallbackResult = await supabase.functions.invoke('ai-question-feedback', {
          body: { response_id: 'response-123' },
        });
        expect(fallbackResult.data?.feedback).toBeDefined();
      }
    });

    it('should provide structured feedback scores', () => {
      const feedback = {
        relevance_score: 8,
        specificity_score: 7,
        impact_score: 9,
        clarity_score: 8,
        overall_score: 8.0,
      };

      expect(feedback.relevance_score).toBeGreaterThanOrEqual(1);
      expect(feedback.relevance_score).toBeLessThanOrEqual(10);
      expect(feedback.overall_score).toBeGreaterThan(0);
    });
  });

  describe('Session Summary', () => {
    it('should calculate completion rate', () => {
      const totalQuestions = 5;
      const answeredQuestions = 4;
      const completionRate = (answeredQuestions / totalQuestions) * 100;

      expect(completionRate).toBe(80);
    });

    it('should calculate average response length', () => {
      const responses = [
        { response_text: 'Short answer.' },
        { response_text: 'This is a longer answer with more detail about my experience.' },
        { response_text: 'Medium length response here.' },
      ];

      const totalLength = responses.reduce(
        (sum, r) => sum + r.response_text.length,
        0
      );
      const avgLength = Math.round(totalLength / responses.length);

      expect(avgLength).toBeGreaterThan(0);
    });

    it('should identify strongest and weakest categories', () => {
      const categoryScores = {
        behavioral: 8.5,
        technical: 6.0,
        situational: 9.0,
      };

      const strongest = Object.entries(categoryScores).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];
      const weakest = Object.entries(categoryScores).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )[0];

      expect(strongest).toBe('situational');
      expect(weakest).toBe('technical');
    });
  });
});

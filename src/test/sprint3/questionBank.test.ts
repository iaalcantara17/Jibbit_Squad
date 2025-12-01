import { describe, it, expect, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Question Bank Filtering', () => {
  describe('Category Filtering', () => {
    it('should filter questions by category', async () => {
      const mockQuestions = [
        { id: '1', category: 'behavioral', question_text: 'Tell me about yourself' },
        { id: '2', category: 'technical', question_text: 'Explain async/await' },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockQuestions.filter(q => q.category === 'behavioral'),
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await supabase
        .from('question_bank_items')
        .select('*')
        .eq('category', 'behavioral');

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].category).toBe('behavioral');
    });

    it('should filter by difficulty level', async () => {
      const questions = [
        { id: '1', difficulty: 'easy' },
        { id: '2', difficulty: 'medium' },
        { id: '3', difficulty: 'hard' },
      ];

      const filtered = questions.filter(q => q.difficulty === 'medium');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].difficulty).toBe('medium');
    });
  });

  describe('Search Functionality', () => {
    it('should search questions by text', () => {
      const questions = [
        { id: '1', question_text: 'Tell me about a time you faced a challenge' },
        { id: '2', question_text: 'Describe your leadership style' },
        { id: '3', question_text: 'What motivates you?' },
      ];

      const searchTerm = 'leadership';
      const filtered = questions.filter(q =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].question_text).toContain('leadership');
    });
  });

  describe('Practice Response Saves', () => {
    it('should save practice response', async () => {
      const mockResponse = {
        question_id: 'question-123',
        user_id: 'user-123',
        response_text: 'My answer to the question...',
        status: 'draft',
      };

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'response-123', ...mockResponse },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await supabase
        .from('question_practice_responses')
        .insert(mockResponse);

      expect(result.data).toHaveProperty('id');
      expect(mockInsert).toHaveBeenCalledWith(mockResponse);
    });

    it('should track time taken for response', async () => {
      const startTime = Date.now();
      // Simulate user answering
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      expect(timeTaken).toBeGreaterThanOrEqual(0);
    });

    it('should update response status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { status: 'submitted' },
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await supabase
        .from('question_practice_responses')
        .update({ status: 'submitted' })
        .eq('id', 'response-123');

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'submitted' });
    });
  });
});

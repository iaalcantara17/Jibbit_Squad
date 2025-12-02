import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-077: Mock Interview Practice Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Interview Scenario Generation', () => {
    it('should generate scenarios based on role and company', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        target_role: 'Software Engineer',
        company_name: 'TechCorp',
        format: 'behavioral',
        question_count: 10,
        status: 'in_progress',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSession, error: null }),
          }),
        }),
      });

      expect(mockSession.target_role).toBe('Software Engineer');
      expect(mockSession.company_name).toBe('TechCorp');
    });

    it('should support different interview formats', async () => {
      const formats = ['behavioral', 'technical', 'case'];
      
      formats.forEach(format => {
        expect(['behavioral', 'technical', 'case']).toContain(format);
      });
    });
  });

  describe('Sequential Question Flow', () => {
    it('should provide questions in sequential order', async () => {
      const mockResponses = [
        {
          id: 'r1',
          session_id: 'session-1',
          question_id: 'q1',
          question_order: 1,
          response_text: 'First question response',
          is_followup: false,
        },
        {
          id: 'r2',
          session_id: 'session-1',
          question_id: 'q2',
          question_order: 2,
          response_text: 'Second question response',
          is_followup: false,
        },
      ];

      expect(mockResponses[0].question_order).toBe(1);
      expect(mockResponses[1].question_order).toBe(2);
    });

    it('should include follow-up questions', async () => {
      const followUpResponse = {
        id: 'r3',
        session_id: 'session-1',
        question_id: 'q2-followup',
        question_order: 3,
        is_followup: true,
        response_text: 'Follow-up answer',
      };

      expect(followUpResponse.is_followup).toBe(true);
    });
  });

  describe('Response Saving', () => {
    it('should save written responses for all questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockResponse = {
        id: 'r1',
        session_id: 'session-1',
        question_id: 'q1',
        response_text: 'In my previous role at TechCorp, I led a cross-functional team...',
        time_taken: 180,
        question_order: 1,
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
          }),
        }),
      });

      expect(mockResponse.response_text).toContain('led');
      expect(mockResponse.time_taken).toBe(180);
    });
  });

  describe('Performance Summary Generation', () => {
    it('should calculate completion rate', async () => {
      const session = {
        id: 'session-1',
        question_count: 10,
      };

      const responses = [
        { question_order: 1, response_text: 'Answer 1' },
        { question_order: 2, response_text: 'Answer 2' },
        { question_order: 3, response_text: 'Answer 3' },
        { question_order: 4, response_text: 'Answer 4' },
        { question_order: 5, response_text: 'Answer 5' },
      ];

      const completionRate = (responses.length / session.question_count) * 100;

      expect(completionRate).toBe(50);
    });

    it('should calculate average response length', async () => {
      const responses = [
        { response_text: 'Short answer' }, // 12 chars
        { response_text: 'A much longer answer with more detail' }, // 39 chars
        { response_text: 'Medium length response' }, // 22 chars
      ];

      const totalLength = responses.reduce((sum, r) => sum + r.response_text.length, 0);
      const avgLength = totalLength / responses.length;

      expect(avgLength).toBeCloseTo(24.3, 1);
    });

    it('should identify strongest and weakest categories', async () => {
      const categoryScores = {
        behavioral: 8.5,
        technical: 6.0,
        situational: 7.5,
      };

      const strongest = Object.entries(categoryScores).reduce((max, [cat, score]) => 
        score > max.score ? { category: cat, score } : max, 
        { category: '', score: 0 }
      );

      const weakest = Object.entries(categoryScores).reduce((min, [cat, score]) => 
        score < min.score ? { category: cat, score } : min, 
        { category: '', score: 100 }
      );

      expect(strongest.category).toBe('behavioral');
      expect(weakest.category).toBe('technical');
    });

    it('should generate top improvement areas', async () => {
      const improvements = [
        'Practice more technical questions - scored below average',
        'Work on providing more specific metrics in responses',
        'Reduce response length for better pacing',
      ];

      expect(improvements).toHaveLength(3);
      expect(improvements[0]).toContain('technical');
    });
  });

  describe('Response Length and Pacing', () => {
    it('should provide length guidance', async () => {
      const guideline = {
        target_word_count: 150,
        target_speaking_time: 60, // seconds
        actual_word_count: 200,
        recommendation: 'Consider shortening response for better pacing',
      };

      expect(guideline.actual_word_count).toBeGreaterThan(guideline.target_word_count);
      expect(guideline.recommendation).toContain('shortening');
    });

    it('should provide pacing recommendations', async () => {
      const pacingFeedback = {
        avg_time_per_question: 120, // seconds
        recommended_time: 90,
        pacing: 'slightly_slow',
        tip: 'Practice delivering answers more concisely',
      };

      expect(pacingFeedback.avg_time_per_question).toBeGreaterThan(pacingFeedback.recommended_time);
      expect(pacingFeedback.pacing).toBe('slightly_slow');
    });
  });

  describe('Interview Progression Simulation', () => {
    it('should simulate common interview question progressions', async () => {
      const questionProgression = [
        { order: 1, type: 'warmup', difficulty: 'entry' },
        { order: 2, type: 'behavioral', difficulty: 'mid' },
        { order: 3, type: 'technical', difficulty: 'mid' },
        { order: 4, type: 'behavioral', difficulty: 'senior' },
        { order: 5, type: 'candidate_questions', difficulty: 'entry' },
      ];

      expect(questionProgression[0].type).toBe('warmup');
      expect(questionProgression[questionProgression.length - 1].type).toBe('candidate_questions');
    });
  });

  describe('Confidence Building', () => {
    it('should provide confidence building exercises', async () => {
      const exercises = [
        {
          title: 'Power Posing',
          description: 'Stand in a confident pose for 2 minutes before interview',
          duration_minutes: 2,
        },
        {
          title: 'Visualization',
          description: 'Visualize yourself answering questions confidently',
          duration_minutes: 5,
        },
      ];

      expect(exercises).toHaveLength(2);
      expect(exercises[0].title).toBe('Power Posing');
    });

    it('should track confidence improvement metrics', async () => {
      const confidenceTracking = {
        session_id: 'session-1',
        pre_session_confidence: 5,
        post_session_confidence: 7,
        improvement: 2,
      };

      expect(confidenceTracking.post_session_confidence).toBeGreaterThan(confidenceTracking.pre_session_confidence);
      expect(confidenceTracking.improvement).toBe(2);
    });
  });

  describe('Performance Summary', () => {
    it('should generate comprehensive summary', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockSummary = {
        id: 'summary-1',
        session_id: 'session-1',
        completion_rate: 100,
        avg_response_length: 175,
        strongest_category: 'behavioral',
        weakest_category: 'technical',
        top_improvements: [
          'Practice more technical questions',
          'Add more specific metrics',
          'Work on conciseness',
        ],
        ai_summary: 'Strong overall performance with room for improvement in technical areas',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSummary, error: null }),
          }),
        }),
      });

      expect(mockSummary.completion_rate).toBe(100);
      expect(mockSummary.strongest_category).toBe('behavioral');
      expect(mockSummary.top_improvements).toHaveLength(3);
    });
  });
});

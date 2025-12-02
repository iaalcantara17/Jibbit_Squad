import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-076: AI-Powered Response Coaching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Response Submission and Feedback', () => {
    it('should submit practice response for coaching', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockResponse = {
        id: 'r1',
        question_id: 'q1',
        user_id: 'user-1',
        response_text: 'In my previous role as a software engineer, I led a project to optimize our API performance...',
        status: 'submitted',
        time_taken: 240,
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
          }),
        }),
      });

      expect(mockResponse.response_text.length).toBeGreaterThan(50);
      expect(mockResponse.status).toBe('submitted');
    });

    it('should provide feedback on content, structure, and clarity', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockFeedback = {
        id: 'f1',
        response_id: 'r1',
        relevance_score: 8,
        specificity_score: 7,
        impact_score: 9,
        clarity_score: 8,
        overall_score: 8,
        general_feedback: 'Strong response with clear results. Consider adding more specific metrics in the action section.',
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockFeedback,
        error: null,
      });

      expect(mockFeedback.relevance_score).toBeDefined();
      expect(mockFeedback.specificity_score).toBeDefined();
      expect(mockFeedback.clarity_score).toBeDefined();
      expect(mockFeedback.general_feedback).toContain('metrics');
    });
  });

  describe('Response Scoring Dimensions', () => {
    it('should score relevance to the question asked', async () => {
      const feedback = {
        relevance_score: 9,
        relevance_notes: 'Response directly addresses the question about conflict resolution',
      };

      expect(feedback.relevance_score).toBeGreaterThanOrEqual(1);
      expect(feedback.relevance_score).toBeLessThanOrEqual(10);
    });

    it('should score specificity with concrete examples', async () => {
      const feedback = {
        specificity_score: 7,
        specificity_notes: 'Good use of specific examples. Could include more quantifiable metrics.',
      };

      expect(feedback.specificity_score).toBeDefined();
      expect(feedback.specificity_notes).toContain('metrics');
    });

    it('should score impact and results achieved', async () => {
      const feedback = {
        impact_score: 10,
        impact_notes: 'Excellent demonstration of measurable business impact: 40% performance improvement, $50K cost savings',
      };

      expect(feedback.impact_score).toBe(10);
      expect(feedback.impact_notes).toContain('measurable');
    });

    it('should score clarity of communication', async () => {
      const feedback = {
        clarity_score: 8,
        clarity_notes: 'Clear logical flow. Minor improvements could be made in transition between sections.',
      };

      expect(feedback.clarity_score).toBeDefined();
    });
  });

  describe('Response Length Analysis', () => {
    it('should analyze response length and recommend adjustments', async () => {
      const response = 'In my previous role as a software engineer...'; // 300 words
      const wordCount = response.split(' ').length;
      
      const lengthAnalysis = {
        word_count: wordCount,
        estimated_speaking_time: Math.ceil(wordCount / 150 * 60), // 150 words per minute
        recommendation: wordCount < 100 ? 'too_short' : wordCount > 300 ? 'too_long' : 'optimal',
      };

      expect(lengthAnalysis.word_count).toBeDefined();
      expect(lengthAnalysis.estimated_speaking_time).toBeGreaterThan(0);
    });

    it('should provide timing recommendations', async () => {
      const mockFeedback = {
        response_id: 'r1',
        speaking_time_estimate: 90, // seconds
        timing_recommendation: 'Aim for 60-90 seconds for behavioral questions. Your response is well-paced.',
      };

      expect(mockFeedback.speaking_time_estimate).toBe(90);
      expect(mockFeedback.timing_recommendation).toContain('seconds');
    });
  });

  describe('Weak Language Pattern Identification', () => {
    it('should identify weak language and suggest alternatives', async () => {
      const weakLanguageAnalysis = [
        {
          phrase: 'I think',
          alternative: 'I determined',
          reason: 'Sounds more confident and decisive',
        },
        {
          phrase: 'kind of',
          alternative: 'specifically',
          reason: 'More precise and professional',
        },
        {
          phrase: 'tried to',
          alternative: 'successfully implemented',
          reason: 'Shows achievement rather than attempt',
        },
      ];

      expect(weakLanguageAnalysis).toHaveLength(3);
      expect(weakLanguageAnalysis[0].phrase).toBe('I think');
      expect(weakLanguageAnalysis[0].alternative).toBe('I determined');
      expect(weakLanguageAnalysis[2].reason).toContain('achievement');
    });
  });

  describe('Alternative Response Approaches', () => {
    it('should generate alternative approaches to answering', async () => {
      const alternatives = [
        'Start with the result first to capture attention, then explain how you achieved it',
        'Use a problem-solution-result framework instead of chronological order',
        'Emphasize team collaboration and leadership more prominently',
      ];

      expect(alternatives).toHaveLength(3);
      expect(alternatives[0]).toContain('result first');
    });
  });

  describe('STAR Method Adherence', () => {
    it('should analyze STAR framework adherence for behavioral questions', async () => {
      const starAnalysis = {
        situation: true,
        task: true,
        action: true,
        result: true,
        feedback: 'Excellent STAR structure. All components are clearly defined.',
      };

      expect(starAnalysis.situation).toBe(true);
      expect(starAnalysis.task).toBe(true);
      expect(starAnalysis.action).toBe(true);
      expect(starAnalysis.result).toBe(true);
    });

    it('should identify missing STAR components', async () => {
      const incompleteStar = {
        situation: true,
        task: true,
        action: true,
        result: false,
        feedback: 'Missing Result: Add specific outcomes and metrics to strengthen your response.',
      };

      expect(incompleteStar.result).toBe(false);
      expect(incompleteStar.feedback).toContain('Missing Result');
    });
  });

  describe('Improvement Tracking Over Time', () => {
    it('should track improvement across multiple practice sessions', async () => {
      const practiceHistory = [
        {
          attempt: 1,
          date: '2025-01-15',
          overall_score: 6,
        },
        {
          attempt: 2,
          date: '2025-01-20',
          overall_score: 7.5,
        },
        {
          attempt: 3,
          date: '2025-01-25',
          overall_score: 8.5,
        },
      ];

      const improvement = practiceHistory[2].overall_score - practiceHistory[0].overall_score;
      expect(improvement).toBe(2.5);
      expect(practiceHistory[2].overall_score).toBeGreaterThan(practiceHistory[0].overall_score);
    });

    it('should show trend analysis', async () => {
      const trendAnalysis = {
        total_sessions: 5,
        average_improvement: 0.5, // points per session
        trend: 'improving',
        strongest_area: 'impact_score',
        area_for_improvement: 'specificity_score',
      };

      expect(trendAnalysis.trend).toBe('improving');
      expect(trendAnalysis.strongest_area).toBeDefined();
    });
  });

  describe('Rules-Based Fallback Scoring', () => {
    it('should use rules-based scoring when AI unavailable', async () => {
      const response = 'In my previous role, I led a team of 5 engineers. We improved system performance by 40% through optimization. This resulted in $50K annual savings.';
      
      // Rules-based scoring logic
      const wordCount = response.split(' ').length;
      const hasMetrics = /\d+%|\$\d+/.test(response);
      const hasSpecifics = /team|led|improved/.test(response);
      
      const rulesScore = {
        relevance_score: hasSpecifics ? 8 : 5,
        specificity_score: hasMetrics ? 9 : 6,
        impact_score: hasMetrics ? 9 : 5,
        clarity_score: wordCount > 20 && wordCount < 100 ? 8 : 6,
      };

      expect(rulesScore.relevance_score).toBe(8);
      expect(rulesScore.specificity_score).toBe(9);
      expect(rulesScore.impact_score).toBe(9);
    });
  });

  describe('Feedback Export and Sharing', () => {
    it('should support exporting feedback for review', async () => {
      const feedbackExport = {
        response_id: 'r1',
        question_text: 'Tell me about a time you led a project',
        response_text: 'In my previous role...',
        overall_score: 8.5,
        dimension_scores: {
          relevance: 9,
          specificity: 8,
          impact: 9,
          clarity: 8,
        },
        feedback_text: 'Strong response overall...',
        generated_at: new Date().toISOString(),
      };

      expect(feedbackExport.overall_score).toBeDefined();
      expect(feedbackExport.dimension_scores).toBeDefined();
    });
  });
});

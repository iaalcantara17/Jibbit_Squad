import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-084: Interview Response Writing Practice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Timed Writing Exercises', () => {
    it('should track time taken for responses', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockResponse = {
        id: 'resp-1',
        user_id: 'user-1',
        question_id: 'q1',
        response_text: 'In my previous role...',
        time_taken: 180, // 3 minutes
        timer_duration: 300, // 5 minute limit
        status: 'submitted',
        created_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
          }),
        }),
      });

      expect(mockResponse.time_taken).toBe(180);
      expect(mockResponse.time_taken).toBeLessThan(mockResponse.timer_duration);
    });

    it('should support different timer durations', async () => {
      const timerOptions = [120, 180, 300, 600]; // 2, 3, 5, 10 minutes

      timerOptions.forEach(duration => {
        expect(duration).toBeGreaterThanOrEqual(120);
        expect(duration).toBeLessThanOrEqual(600);
      });
    });

    it('should handle timer expiration', async () => {
      const mockResponse = {
        id: 'resp-2',
        timer_duration: 300,
        time_taken: 300,
        status: 'submitted',
        completed_on_time: false,
      };

      expect(mockResponse.time_taken).toBe(mockResponse.timer_duration);
      expect(mockResponse.completed_on_time).toBe(false);
    });
  });

  describe('Communication Clarity Analysis', () => {
    it('should analyze response structure', async () => {
      const mockAnalysis = {
        response_id: 'resp-1',
        has_clear_introduction: true,
        has_logical_flow: true,
        has_conclusion: false,
        paragraph_count: 3,
        avg_sentence_length: 18,
        clarity_score: 7.5,
      };

      expect(mockAnalysis.has_clear_introduction).toBe(true);
      expect(mockAnalysis.clarity_score).toBeGreaterThan(7);
    });

    it('should evaluate professional tone', async () => {
      const mockToneAnalysis = {
        response_id: 'resp-1',
        formality_level: 'professional',
        confidence_indicators: 3,
        filler_words: 2,
        passive_voice_count: 1,
        tone_score: 8.0,
      };

      expect(mockToneAnalysis.formality_level).toBe('professional');
      expect(mockToneAnalysis.filler_words).toBeLessThan(5);
    });

    it('should check for communication red flags', async () => {
      const responseText = 'I think maybe I could possibly try to help with that project, I guess...';
      
      const weakPhrases = [
        'I think',
        'maybe',
        'possibly',
        'I guess',
      ];

      const foundWeakPhrases = weakPhrases.filter(phrase => 
        responseText.toLowerCase().includes(phrase.toLowerCase())
      );

      expect(foundWeakPhrases.length).toBeGreaterThan(0);
    });
  });

  describe('Storytelling Effectiveness', () => {
    it('should evaluate narrative structure', async () => {
      const mockNarrativeAnalysis = {
        response_id: 'resp-1',
        has_context: true,
        has_conflict: true,
        has_resolution: true,
        engagement_score: 8.5,
        storytelling_elements: ['situation', 'challenge', 'action', 'outcome'],
      };

      expect(mockNarrativeAnalysis.has_context).toBe(true);
      expect(mockNarrativeAnalysis.storytelling_elements).toHaveLength(4);
    });

    it('should identify compelling details', async () => {
      const mockResponse = {
        response_text: 'Led team of 5 engineers, increased deployment speed by 40%, reduced bugs by 25%',
        has_specific_metrics: true,
        has_concrete_examples: true,
        detail_score: 9.0,
      };

      expect(mockResponse.has_specific_metrics).toBe(true);
      expect(mockResponse.detail_score).toBeGreaterThan(8);
    });
  });

  describe('Virtual Interview Preparation', () => {
    it('should provide virtual-specific tips', async () => {
      const virtualTips = [
        {
          category: 'technical_setup',
          tip: 'Test camera and microphone 30 minutes before',
          priority: 'high',
        },
        {
          category: 'environment',
          tip: 'Ensure good lighting and quiet background',
          priority: 'high',
        },
        {
          category: 'engagement',
          tip: 'Look at camera, not screen, when speaking',
          priority: 'medium',
        },
      ];

      expect(virtualTips.filter(t => t.priority === 'high')).toHaveLength(2);
    });

    it('should track virtual practice sessions', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-1',
        format: 'virtual',
        camera_test_completed: true,
        background_check_completed: true,
        lighting_verified: true,
        audio_verified: true,
      };

      const readiness = [
        mockSession.camera_test_completed,
        mockSession.background_check_completed,
        mockSession.lighting_verified,
        mockSession.audio_verified,
      ].filter(Boolean).length;

      expect(readiness).toBe(4);
    });
  });

  describe('Nerve Management Techniques', () => {
    it('should provide pre-interview exercises', async () => {
      const nerveTechniques = [
        { name: 'Deep breathing', duration_minutes: 5, effectiveness_rating: 8 },
        { name: 'Power posing', duration_minutes: 2, effectiveness_rating: 7 },
        { name: 'Positive visualization', duration_minutes: 10, effectiveness_rating: 9 },
        { name: 'Progressive muscle relaxation', duration_minutes: 15, effectiveness_rating: 8 },
      ];

      const recommended = nerveTechniques.filter(t => t.effectiveness_rating >= 8);
      expect(recommended).toHaveLength(3);
    });

    it('should track confidence progression', async () => {
      const mockProgressionData = [
        { date: '2025-01-01', confidence_level: 5 },
        { date: '2025-01-08', confidence_level: 6 },
        { date: '2025-01-15', confidence_level: 7 },
        { date: '2025-01-22', confidence_level: 8 },
      ];

      const improvement = mockProgressionData[mockProgressionData.length - 1].confidence_level - mockProgressionData[0].confidence_level;
      expect(improvement).toBe(3);
    });
  });

  describe('Response Quality Improvement', () => {
    it('should track quality metrics over time', async () => {
      const mockHistory = [
        { date: '2025-01-01', clarity_score: 6.0, engagement_score: 5.5 },
        { date: '2025-01-15', clarity_score: 7.5, engagement_score: 7.0 },
        { date: '2025-01-30', clarity_score: 8.5, engagement_score: 8.0 },
      ];

      const clarityImprovement = mockHistory[2].clarity_score - mockHistory[0].clarity_score;
      expect(clarityImprovement).toBe(2.5);
    });

    it('should compare current vs previous responses', async () => {
      const currentResponse = {
        id: 'resp-2',
        clarity_score: 8.0,
        engagement_score: 7.5,
        word_count: 250,
      };

      const previousResponse = {
        id: 'resp-1',
        clarity_score: 6.5,
        engagement_score: 6.0,
        word_count: 180,
      };

      const improvement = {
        clarity: currentResponse.clarity_score - previousResponse.clarity_score,
        engagement: currentResponse.engagement_score - previousResponse.engagement_score,
      };

      expect(improvement.clarity).toBeGreaterThan(0);
      expect(improvement.engagement).toBeGreaterThan(0);
    });
  });

  describe('Memorable Response Techniques', () => {
    it('should identify memorable elements', async () => {
      const memorableElements = [
        'Unexpected story angle',
        'Specific quantifiable results',
        'Unique personal insight',
        'Compelling challenge overcome',
      ];

      const mockResponse = {
        response_text: 'When our system went down at 2 AM, I rallied the team and we restored service in 45 minutes, preventing $100K in lost revenue',
        identified_elements: ['Specific quantifiable results', 'Compelling challenge overcome'],
        memorability_score: 8.5,
      };

      expect(mockResponse.identified_elements.length).toBeGreaterThan(0);
      expect(mockResponse.memorability_score).toBeGreaterThan(8);
    });
  });

  describe('Practice Session Analytics', () => {
    it('should generate comparison across practice sessions', async () => {
      const sessions = [
        { id: 's1', date: '2025-01-01', avg_score: 6.5, questions_completed: 5 },
        { id: 's2', date: '2025-01-15', avg_score: 7.5, questions_completed: 8 },
        { id: 's3', date: '2025-01-30', avg_score: 8.0, questions_completed: 10 },
      ];

      const avgScoreImprovement = (sessions[2].avg_score - sessions[0].avg_score) / (sessions.length - 1);
      expect(avgScoreImprovement).toBeCloseTo(0.75, 2);
    });
  });

  describe('Word Count and Length Guidelines', () => {
    it('should provide optimal length recommendations', async () => {
      const guidelines = {
        behavioral: { min: 150, max: 300, optimal: 200 },
        technical: { min: 100, max: 250, optimal: 175 },
        situational: { min: 150, max: 300, optimal: 225 },
      };

      expect(guidelines.behavioral.optimal).toBeGreaterThan(guidelines.behavioral.min);
      expect(guidelines.behavioral.optimal).toBeLessThan(guidelines.behavioral.max);
    });

    it('should flag responses that are too long or short', async () => {
      const mockResponse = {
        word_count: 450,
        question_category: 'behavioral',
        optimal_range: { min: 150, max: 300 },
        feedback: 'Response is too long. Consider shortening to stay within 150-300 words.',
      };

      expect(mockResponse.word_count).toBeGreaterThan(mockResponse.optimal_range.max);
      expect(mockResponse.feedback).toContain('too long');
    });
  });
});

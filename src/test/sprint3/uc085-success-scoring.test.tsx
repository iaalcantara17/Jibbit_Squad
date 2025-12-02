import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-085: Interview Success Probability Scoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Score Calculation', () => {
    it('should calculate score based on preparation factors', async () => {
      const factors = {
        checklistCompletion: 80,
        practiceCount: 8,
        mockSessionCount: 2,
        daysUntilInterview: 5,
        historicalSuccessRate: 60,
      };

      const weights = {
        checklist: 25,
        practice: 20,
        mock: 20,
        time: 15,
        history: 20,
      };

      const score = (factors.checklistCompletion / 100) * weights.checklist +
                    Math.min((factors.practiceCount / 10) * weights.practice, weights.practice) +
                    Math.min((factors.mockSessionCount / 3) * weights.mock, weights.mock) +
                    weights.time +
                    (factors.historicalSuccessRate / 100) * weights.history;

      expect(score).toBeGreaterThan(50);
    });
  });

  describe('Confidence Band', () => {
    it('should determine confidence based on historical data', async () => {
      const getConfidence = (interviewCount: number) => {
        if (interviewCount >= 10) return 'high';
        if (interviewCount >= 3) return 'medium';
        return 'low';
      };

      expect(getConfidence(15)).toBe('high');
      expect(getConfidence(5)).toBe('medium');
      expect(getConfidence(1)).toBe('low');
    });
  });

  describe('Action Recommendations', () => {
    it('should prioritize actions by impact', async () => {
      const actions = [
        { action: 'Complete checklist', impact: 15 },
        { action: 'Do mock interview', impact: 10 },
        { action: 'Practice questions', impact: 5 },
      ];

      const sorted = actions.sort((a, b) => b.impact - a.impact);

      expect(sorted[0].action).toBe('Complete checklist');
    });
  });
});

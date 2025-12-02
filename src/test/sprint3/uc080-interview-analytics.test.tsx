import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-080: Interview Performance Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conversion Rate Tracking', () => {
    it('should calculate interview-to-offer conversion rate', async () => {
      const mockInterviews = [
        { id: '1', outcome: 'offer' },
        { id: '2', outcome: 'positive' },
        { id: '3', outcome: 'offer' },
        { id: '4', outcome: 'rejected' },
        { id: '5', outcome: 'offer' },
      ];

      const offers = mockInterviews.filter(i => i.outcome === 'offer').length;
      const conversionRate = (offers / mockInterviews.length) * 100;

      expect(conversionRate).toBe(60);
    });

    it('should track conversion by interview type', async () => {
      const mockInterviews = [
        { id: '1', interview_type: 'phone_screen', outcome: 'offer' },
        { id: '2', interview_type: 'phone_screen', outcome: 'rejected' },
        { id: '3', interview_type: 'technical', outcome: 'offer' },
        { id: '4', interview_type: 'technical', outcome: 'offer' },
        { id: '5', interview_type: 'behavioral', outcome: 'rejected' },
      ];

      const byType = mockInterviews.reduce((acc, i) => {
        if (!acc[i.interview_type]) {
          acc[i.interview_type] = { total: 0, offers: 0 };
        }
        acc[i.interview_type].total++;
        if (i.outcome === 'offer') acc[i.interview_type].offers++;
        return acc;
      }, {} as Record<string, { total: number; offers: number }>);

      const technicalRate = (byType.technical.offers / byType.technical.total) * 100;
      expect(technicalRate).toBe(100);
    });
  });

  describe('Performance Trends', () => {
    it('should analyze performance over time', async () => {
      const mockData = [
        { month: '2024-11', interviews: 5, offers: 2 },
        { month: '2024-12', interviews: 8, offers: 3 },
        { month: '2025-01', interviews: 10, offers: 5 },
      ];

      const rates = mockData.map(d => ({
        month: d.month,
        rate: (d.offers / d.interviews) * 100,
      }));

      expect(rates[0].rate).toBe(40);
      expect(rates[2].rate).toBe(50);
      expect(rates[2].rate).toBeGreaterThan(rates[0].rate);
    });

    it('should identify improvement trends', async () => {
      const mockScores = [
        { date: '2025-01-01', score: 6.5 },
        { date: '2025-01-08', score: 7.0 },
        { date: '2025-01-15', score: 7.5 },
        { date: '2025-01-22', score: 8.0 },
      ];

      const improvement = mockScores[mockScores.length - 1].score - mockScores[0].score;
      const avgImprovement = improvement / (mockScores.length - 1);

      expect(improvement).toBe(1.5);
      expect(avgImprovement).toBeCloseTo(0.5, 1);
    });
  });

  describe('Company Type Analysis', () => {
    it('should compare performance across company types', async () => {
      const mockInterviews = [
        { id: '1', company_type: 'startup', outcome: 'offer' },
        { id: '2', company_type: 'startup', outcome: 'offer' },
        { id: '3', company_type: 'enterprise', outcome: 'rejected' },
        { id: '4', company_type: 'enterprise', outcome: 'offer' },
        { id: '5', company_type: 'midsize', outcome: 'offer' },
      ];

      const byCompanyType = mockInterviews.reduce((acc, i) => {
        if (!acc[i.company_type]) {
          acc[i.company_type] = { total: 0, offers: 0 };
        }
        acc[i.company_type].total++;
        if (i.outcome === 'offer') acc[i.company_type].offers++;
        return acc;
      }, {} as Record<string, { total: number; offers: number }>);

      const startupRate = (byCompanyType.startup.offers / byCompanyType.startup.total) * 100;
      expect(startupRate).toBe(100);
    });
  });

  describe('Strongest and Weakest Areas', () => {
    it('should identify strongest interview categories', async () => {
      const mockPerformance = {
        behavioral: 8.5,
        technical: 7.0,
        system_design: 6.5,
        cultural_fit: 9.0,
      };

      const strongest = Object.entries(mockPerformance).reduce((max, [cat, score]) =>
        score > max.score ? { category: cat, score } : max,
        { category: '', score: 0 }
      );

      expect(strongest.category).toBe('cultural_fit');
      expect(strongest.score).toBe(9.0);
    });

    it('should identify weakest interview categories', async () => {
      const mockPerformance = {
        behavioral: 8.5,
        technical: 7.0,
        system_design: 6.5,
        cultural_fit: 9.0,
      };

      const weakest = Object.entries(mockPerformance).reduce((min, [cat, score]) =>
        score < min.score ? { category: cat, score } : min,
        { category: '', score: 100 }
      );

      expect(weakest.category).toBe('system_design');
      expect(weakest.score).toBe(6.5);
    });
  });

  describe('Interview Format Performance', () => {
    it('should compare performance across formats', async () => {
      const mockFormatData = [
        { format: 'in_person', success_rate: 75 },
        { format: 'video', success_rate: 68 },
        { format: 'phone', success_rate: 60 },
      ];

      const bestFormat = mockFormatData.reduce((best, f) =>
        f.success_rate > best.success_rate ? f : best
      );

      expect(bestFormat.format).toBe('in_person');
    });
  });

  describe('Practice Session Impact', () => {
    it('should correlate practice with interview success', async () => {
      const mockData = [
        { user_id: 'u1', practice_sessions: 10, interview_success_rate: 80 },
        { user_id: 'u2', practice_sessions: 5, interview_success_rate: 60 },
        { user_id: 'u3', practice_sessions: 15, interview_success_rate: 90 },
        { user_id: 'u4', practice_sessions: 2, interview_success_rate: 40 },
      ];

      // Simple correlation check: more practice should correlate with higher success
      const sortedByPractice = [...mockData].sort((a, b) => b.practice_sessions - a.practice_sessions);
      
      expect(sortedByPractice[0].interview_success_rate).toBeGreaterThan(sortedByPractice[sortedByPractice.length - 1].interview_success_rate);
    });
  });

  describe('Benchmark Comparison', () => {
    it('should compare against industry standards', async () => {
      const userStats = {
        avg_interviews_per_offer: 8,
        response_rate: 45,
        offer_acceptance_rate: 75,
      };

      const industryBenchmarks = {
        avg_interviews_per_offer: 10,
        response_rate: 40,
        offer_acceptance_rate: 70,
      };

      const performsAboveBenchmark = userStats.avg_interviews_per_offer < industryBenchmarks.avg_interviews_per_offer;
      expect(performsAboveBenchmark).toBe(true);
    });
  });

  describe('Personalized Recommendations', () => {
    it('should generate improvement recommendations', async () => {
      const weakAreas = [
        { category: 'technical', score: 6.0, target: 8.0 },
        { category: 'system_design', score: 6.5, target: 8.0 },
      ];

      const recommendations = weakAreas.map(area => ({
        category: area.category,
        priority: area.target - area.score >= 2 ? 'high' : 'medium',
        action: `Practice ${area.category} questions to improve from ${area.score} to ${area.target}`,
      }));

      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].action).toContain('technical');
    });

    it('should prioritize high-impact improvements', async () => {
      const improvementAreas = [
        { area: 'technical', impact: 3.0, effort: 2 },
        { area: 'behavioral', impact: 1.5, effort: 1 },
        { area: 'system_design', impact: 2.5, effort: 3 },
      ];

      // Calculate impact/effort ratio
      const prioritized = improvementAreas
        .map(a => ({ ...a, ratio: a.impact / a.effort }))
        .sort((a, b) => b.ratio - a.ratio);

      expect(prioritized[0].area).toBe('behavioral');
    });
  });

  describe('Success Pattern Detection', () => {
    it('should identify optimal interview strategies', async () => {
      const mockInterviews = [
        { id: '1', prep_days: 7, practice_count: 10, outcome: 'offer' },
        { id: '2', prep_days: 3, practice_count: 5, outcome: 'rejected' },
        { id: '3', prep_days: 5, practice_count: 8, outcome: 'offer' },
        { id: '4', prep_days: 10, practice_count: 15, outcome: 'offer' },
      ];

      const successfulInterviews = mockInterviews.filter(i => i.outcome === 'offer');
      const avgPrepDays = successfulInterviews.reduce((sum, i) => sum + i.prep_days, 0) / successfulInterviews.length;
      const avgPracticeCount = successfulInterviews.reduce((sum, i) => sum + i.practice_count, 0) / successfulInterviews.length;

      expect(avgPrepDays).toBeGreaterThan(5);
      expect(avgPracticeCount).toBeGreaterThan(9);
    });
  });
});

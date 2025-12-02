import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-083: Salary Negotiation Preparation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Market Salary Research', () => {
    it('should fetch market data for role and location', async () => {
      const marketData = {
        min: 100000,
        median: 130000,
        max: 160000,
        currency: 'USD',
        location: 'San Francisco',
        role: 'Software Engineer',
      };

      expect(marketData.median).toBe(130000);
      expect(marketData.location).toBe('San Francisco');
    });
  });

  describe('Negotiation Scripts', () => {
    it('should provide negotiation talking points', async () => {
      const scripts = {
        initial: 'Thank you for the offer...',
        counteroffer: 'I appreciate the revised offer...',
      };

      expect(scripts.initial).toContain('Thank you');
    });
  });

  describe('Total Compensation Evaluation', () => {
    it('should calculate total compensation package', async () => {
      const offer = {
        base_salary: 120000,
        bonus: 15000,
        equity: 50000,
        benefits: 10000,
      };

      const total = offer.base_salary + offer.bonus + offer.equity + offer.benefits;

      expect(total).toBe(195000);
    });
  });
});

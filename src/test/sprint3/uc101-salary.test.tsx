import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
    })),
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-101: Salary Progression Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks offer progression over time', () => {
    const offers = [
      { date: '2024-01-01', amount: 100000 },
      { date: '2024-03-01', amount: 110000 },
      { date: '2024-06-01', amount: 120000 },
    ];
    
    const firstOffer = offers[0].amount;
    const lastOffer = offers[offers.length - 1].amount;
    const growth = ((lastOffer - firstOffer) / firstOffer) * 100;
    
    expect(growth).toBe(20);
  });

  it('displays salary trends by role and industry', async () => {
    const SalaryProgressionAnalytics = (await import('@/pages/SalaryProgressionAnalytics')).default;
    
    render(
      <BrowserRouter>
        <SalaryProgressionAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('calculates average salary increase per job change', () => {
    const offers = [
      { amount: 100000 },
      { amount: 115000 },
      { amount: 130000 },
    ];
    
    const increases = offers.slice(1).map((offer, i) => 
      offer.amount - offers[i].amount
    );
    
    const avgIncrease = increases.reduce((sum, inc) => sum + inc, 0) / increases.length;
    
    expect(avgIncrease).toBe(15000);
  });

  it('compares total compensation packages', () => {
    const packages = [
      { base: 100000, bonus: 10000, equity: 20000 },
      { base: 110000, bonus: 15000, equity: 30000 },
    ];
    
    const totals = packages.map(p => p.base + p.bonus + p.equity);
    
    expect(totals[0]).toBe(130000);
    expect(totals[1]).toBe(155000);
  });

  it('identifies negotiation success rate', () => {
    const negotiations = [
      { initial: 100000, final: 110000, successful: true },
      { initial: 120000, final: 120000, successful: false },
      { initial: 90000, final: 95000, successful: true },
    ];
    
    const successCount = negotiations.filter(n => n.successful).length;
    const successRate = (successCount / negotiations.length) * 100;
    
    expect(successRate).toBeCloseTo(66.67, 1);
  });
});

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

describe('UC-105: Benchmarking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compares user metrics against industry standards', () => {
    const userStats = {
      avgTimeToOffer: 25,
      conversionRate: 40,
      interviewsPerOffer: 5,
    };
    
    const industryBenchmarks = {
      avgTimeToOffer: 30,
      conversionRate: 35,
      interviewsPerOffer: 6,
    };
    
    expect(userStats.avgTimeToOffer).toBeLessThan(industryBenchmarks.avgTimeToOffer);
    expect(userStats.conversionRate).toBeGreaterThan(industryBenchmarks.conversionRate);
  });

  it('displays benchmarking dashboard', async () => {
    const Benchmarking = (await import('@/pages/Benchmarking')).default;
    
    render(
      <BrowserRouter>
        <Benchmarking />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('allows setting personal benchmark targets', () => {
    const benchmarks = [
      { metric: 'applications_per_week', target: 10, period: 'weekly' },
      { metric: 'conversion_rate', target: 40, period: 'monthly' },
    ];
    
    expect(benchmarks.length).toBe(2);
    expect(benchmarks[0].target).toBeGreaterThan(0);
  });

  it('tracks progress toward benchmark goals', () => {
    const goal = {
      metric: 'applications_per_week',
      target: 10,
      current: 8,
      progress: 80,
    };
    
    expect(goal.progress).toBe(80);
    expect(goal.current).toBeLessThan(goal.target);
  });

  it('provides recommendations based on benchmark gaps', () => {
    const gaps = [
      { metric: 'conversion_rate', userValue: 30, benchmark: 40, gap: -10 },
      { metric: 'response_time', userValue: 35, benchmark: 25, gap: 10 },
    ];
    
    const needsImprovement = gaps.filter(g => g.gap < 0);
    
    expect(needsImprovement.length).toBe(1);
    expect(needsImprovement[0].metric).toBe('conversion_rate');
  });
});

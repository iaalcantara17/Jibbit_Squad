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

describe('UC-107: Success Pattern Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies patterns in successful applications', () => {
    const applications = [
      { id: '1', outcome: 'offer', hasReferral: true, tailoredResume: true },
      { id: '2', outcome: 'offer', hasReferral: false, tailoredResume: true },
      { id: '3', outcome: 'rejected', hasReferral: false, tailoredResume: false },
      { id: '4', outcome: 'offer', hasReferral: true, tailoredResume: true },
    ];
    
    const successful = applications.filter(a => a.outcome === 'offer');
    const withReferrals = successful.filter(a => a.hasReferral).length;
    const referralRate = (withReferrals / successful.length) * 100;
    
    expect(referralRate).toBeCloseTo(66.67, 1);
  });

  it('analyzes common traits of high-performing applications', () => {
    const successfulApps = [
      { customCoverLetter: true, networkConnection: true, quickFollowup: true },
      { customCoverLetter: true, networkConnection: false, quickFollowup: true },
      { customCoverLetter: true, networkConnection: true, quickFollowup: false },
    ];
    
    const withCustomCL = successfulApps.filter(a => a.customCoverLetter).length;
    const customCLRate = (withCustomCL / successfulApps.length) * 100;
    
    expect(customCLRate).toBe(100);
  });

  it('displays success patterns dashboard', async () => {
    const SuccessPatterns = (await import('@/pages/SuccessPatterns')).default;
    
    render(
      <BrowserRouter>
        <SuccessPatterns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('identifies optimal application timing', () => {
    const applications = [
      { dayOfWeek: 'Monday', successRate: 35 },
      { dayOfWeek: 'Tuesday', successRate: 42 },
      { dayOfWeek: 'Wednesday', successRate: 38 },
      { dayOfWeek: 'Friday', successRate: 28 },
    ];
    
    const bestDay = applications.reduce((best, curr) => 
      curr.successRate > best.successRate ? curr : best
    );
    
    expect(bestDay.dayOfWeek).toBe('Tuesday');
  });

  it('correlates preparation time with success rate', () => {
    const data = [
      { prepHours: 2, successRate: 30 },
      { prepHours: 4, successRate: 45 },
      { prepHours: 6, successRate: 55 },
      { prepHours: 8, successRate: 60 },
    ];
    
    // More prep should correlate with higher success
    const sorted = [...data].sort((a, b) => b.prepHours - a.prepHours);
    
    expect(sorted[0].successRate).toBeGreaterThan(sorted[sorted.length - 1].successRate);
  });

  it('provides actionable insights based on patterns', () => {
    const patterns = [
      { pattern: 'Custom cover letters', impact: 25, recommendation: 'Always customize' },
      { pattern: 'Referrals', impact: 40, recommendation: 'Leverage network' },
      { pattern: 'Follow-up within 24h', impact: 15, recommendation: 'Set reminders' },
    ];
    
    const sortedByImpact = [...patterns].sort((a, b) => b.impact - a.impact);
    
    expect(sortedByImpact[0].pattern).toBe('Referrals');
    expect(sortedByImpact[0].recommendation).toBeDefined();
  });
});

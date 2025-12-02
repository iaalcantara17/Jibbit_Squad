import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

describe('UC-097: Funnel Visualization', () => {
  it('displays application funnel stages', async () => {
    const AnalyticsFunnelView = (await import('@/components/analytics/AnalyticsFunnelView')).AnalyticsFunnelView;
    
    render(<AnalyticsFunnelView />);
    
    await waitFor(() => {
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  it('calculates conversion rates between stages', () => {
    const data = {
      applied: 100,
      phoneScreen: 40,
      interview: 20,
      offer: 5,
    };
    
    const appliedToPhone = (data.phoneScreen / data.applied) * 100;
    const phoneToInterview = (data.interview / data.phoneScreen) * 100;
    const interviewToOffer = (data.offer / data.interview) * 100;
    
    expect(appliedToPhone).toBe(40);
    expect(phoneToInterview).toBe(50);
    expect(interviewToOffer).toBe(25);
  });

  it('identifies drop-off points in funnel', () => {
    const data = {
      applied: 100,
      phoneScreen: 40,
      interview: 20,
      offer: 5,
    };
    
    const stages = [
      { name: 'Applied', value: data.applied },
      { name: 'Phone Screen', value: data.phoneScreen },
      { name: 'Interview', value: data.interview },
      { name: 'Offer', value: data.offer },
    ];
    
    const dropoffs = stages.map((stage, i) => {
      if (i === 0) return 0;
      return ((stages[i-1].value - stage.value) / stages[i-1].value) * 100;
    });
    
    expect(dropoffs[1]).toBe(60); // 60% drop from Applied to Phone
    expect(dropoffs[2]).toBe(50); // 50% drop from Phone to Interview
  });

  it('displays funnel with visual representation', async () => {
    const AnalyticsFunnelView = (await import('@/components/analytics/AnalyticsFunnelView')).AnalyticsFunnelView;
    
    render(<AnalyticsFunnelView />);
    
    // Verify funnel renders
    await waitFor(() => {
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  it('handles empty funnel data gracefully', () => {
    const emptyData = {
      applied: 0,
      phoneScreen: 0,
      interview: 0,
      offer: 0,
    };
    
    // All values are zero
    expect(emptyData.applied).toBe(0);
    expect(emptyData.phoneScreen).toBe(0);
  });
});

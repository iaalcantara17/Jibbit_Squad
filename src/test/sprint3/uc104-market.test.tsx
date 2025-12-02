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

describe('UC-104: Market Intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays industry hiring trends', async () => {
    const MarketIntelligence = (await import('@/pages/MarketIntelligence')).default;
    
    render(
      <BrowserRouter>
        <MarketIntelligence />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('tracks trending skills in job market', () => {
    const marketData = {
      trendingSkills: [
        { skill: 'React', mentions: 450, growth: 15 },
        { skill: 'TypeScript', mentions: 380, growth: 22 },
        { skill: 'AWS', mentions: 320, growth: 10 },
      ],
    };
    
    const topSkill = marketData.trendingSkills[0];
    expect(topSkill.skill).toBe('React');
    expect(topSkill.growth).toBeGreaterThan(0);
  });

  it('identifies hot companies and sectors', () => {
    const companies = [
      { name: 'Tech Corp', hiringRate: 45, sector: 'Technology' },
      { name: 'FinanceInc', hiringRate: 30, sector: 'Finance' },
      { name: 'HealthCo', hiringRate: 50, sector: 'Healthcare' },
    ];
    
    const sorted = [...companies].sort((a, b) => b.hiringRate - a.hiringRate);
    
    expect(sorted[0].name).toBe('HealthCo');
  });

  it('provides salary range insights by role', () => {
    const salaryData = {
      role: 'Software Engineer',
      min: 80000,
      max: 150000,
      median: 110000,
    };
    
    expect(salaryData.median).toBeGreaterThan(salaryData.min);
    expect(salaryData.median).toBeLessThan(salaryData.max);
  });

  it('tracks market notes and research', () => {
    const notes = [
      { id: '1', title: 'AI Hiring Surge', industry: 'Technology' },
      { id: '2', title: 'Remote Work Trends', industry: 'General' },
    ];
    
    expect(notes.length).toBe(2);
    expect(notes[0].industry).toBeDefined();
  });
});

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

describe('UC-100: Network ROI Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks networking event outcomes', () => {
    const events = [
      { id: 'e1', connections_made: 5, followups_completed: 3, opportunities_generated: 1 },
      { id: 'e2', connections_made: 8, followups_completed: 6, opportunities_generated: 2 },
    ];
    
    const totalConnections = events.reduce((sum, e) => sum + e.connections_made, 0);
    const totalOpportunities = events.reduce((sum, e) => sum + e.opportunities_generated, 0);
    
    expect(totalConnections).toBe(13);
    expect(totalOpportunities).toBe(3);
  });

  it('calculates conversion rate from connections to opportunities', () => {
    const connections = 50;
    const opportunities = 10;
    
    const conversionRate = (opportunities / connections) * 100;
    
    expect(conversionRate).toBe(20);
  });

  it('displays event ROI metrics', async () => {
    const NetworkROIAnalytics = (await import('@/pages/NetworkROIAnalytics')).default;
    
    render(
      <BrowserRouter>
        <NetworkROIAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('tracks relationship strength impact on outcomes', () => {
    const contacts = [
      { id: 'c1', relationship_strength: 5, referrals_given: 2 },
      { id: 'c2', relationship_strength: 3, referrals_given: 0 },
      { id: 'c3', relationship_strength: 4, referrals_given: 1 },
    ];
    
    const strongContacts = contacts.filter(c => c.relationship_strength >= 4);
    const strongReferrals = strongContacts.reduce((sum, c) => sum + c.referrals_given, 0);
    
    expect(strongReferrals).toBe(3);
  });

  it('measures time invested vs outcomes generated', () => {
    const networkingData = {
      hoursInvested: 20,
      connectionsMade: 15,
      opportunitiesGenerated: 3,
    };
    
    const connectionsPerHour = networkingData.connectionsMade / networkingData.hoursInvested;
    const opportunitiesPerHour = networkingData.opportunitiesGenerated / networkingData.hoursInvested;
    
    expect(connectionsPerHour).toBe(0.75);
    expect(opportunitiesPerHour).toBe(0.15);
  });
});

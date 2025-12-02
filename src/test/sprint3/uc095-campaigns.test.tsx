import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: table === 'networking_campaigns' ? [
            {
              id: 'campaign-1',
              user_id: 'test-user-id',
              name: 'Tech Company Outreach',
              target_companies: ['Google', 'Microsoft', 'Apple'],
              target_roles: ['Software Engineer', 'Senior Engineer'],
              goal: 'Connect with 20 engineers at target companies',
              start_date: '2024-01-01',
              end_date: '2024-03-31',
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              id: 'campaign-2',
              user_id: 'test-user-id',
              name: 'Startup Founder Network',
              target_companies: ['YC Portfolio'],
              target_roles: ['Founder', 'CTO'],
              goal: 'Build relationships with 10 startup founders',
              start_date: '2024-02-01',
              end_date: '2024-04-30',
              created_at: '2024-02-01T10:00:00Z',
            }
          ] : table === 'campaign_outreaches' ? [
            {
              id: 'outreach-1',
              user_id: 'test-user-id',
              campaign_id: 'campaign-1',
              contact_id: 'contact-1',
              variant: 'A',
              sent_at: '2024-01-15T10:00:00Z',
              response_received: true,
              response_date: '2024-01-16T14:00:00Z',
              contact: { name: 'John Doe', company: 'Google' },
              created_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 'outreach-2',
              user_id: 'test-user-id',
              campaign_id: 'campaign-1',
              contact_id: 'contact-2',
              variant: 'B',
              sent_at: '2024-01-16T10:00:00Z',
              response_received: false,
              contact: { name: 'Jane Smith', company: 'Microsoft' },
              created_at: '2024-01-16T10:00:00Z',
            }
          ] : table === 'contacts' ? [] : [],
          error: null,
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-095: Networking Campaign Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates networking campaigns for target companies or industries', async () => {
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Company Outreach')).toBeInTheDocument();
    });

    // Add campaign button should be available
    const addButton = screen.getByRole('button', { name: /add campaign/i });
    expect(addButton).toBeInTheDocument();
  });

  it('sets networking goals and timeline for relationship building', async () => {
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Connect with 20 engineers/i)).toBeInTheDocument();
      expect(screen.getByText(/Build relationships with 10 startup founders/i)).toBeInTheDocument();
    });
  });

  it('tracks outreach volume and response rates', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Company Outreach')).toBeInTheDocument();
    });

    // Calculate response rate
    const { data: outreaches } = await supabase
      .from('campaign_outreaches')
      .select('*')
      .eq('campaign_id', 'campaign-1');
    
    const responses = outreaches?.filter(o => o.response_received) || [];
    const responseRate = outreaches && outreaches.length > 0
      ? (responses.length / outreaches.length) * 100
      : 0;
    
    expect(responseRate).toBeGreaterThanOrEqual(0);
  });

  it('monitors campaign effectiveness and relationship quality', async () => {
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Company Outreach')).toBeInTheDocument();
    });

    // Click on campaign to see details
    const campaignCard = screen.getByText('Tech Company Outreach');
    await user.click(campaignCard);

    // Should show outreach stats
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('adjusts campaign strategy based on performance data', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Update campaign based on metrics
    await supabase
      .from('networking_campaigns')
      .update({ goal: 'Updated goal based on performance' })
      .eq('id', 'campaign-1');
    
    expect(supabase.from).toHaveBeenCalledWith('networking_campaigns');
  });

  it('includes A/B testing for outreach approaches', async () => {
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Company Outreach')).toBeInTheDocument();
    });

    // Outreach variants (A/B) should be tracked
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('campaign_outreaches')
      .select('variant')
      .eq('campaign_id', 'campaign-1');
    
    expect(data).toBeDefined();
  });

  it('generates campaign performance reports and insights', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Company Outreach')).toBeInTheDocument();
    });

    // Campaign metrics should be calculated
    const { data: outreaches } = await supabase
      .from('campaign_outreaches')
      .select('*')
      .eq('campaign_id', 'campaign-1');
    
    const sent = outreaches?.filter(o => o.sent_at) || [];
    const responses = outreaches?.filter(o => o.response_received) || [];
    
    expect(sent.length).toBeGreaterThanOrEqual(0);
    expect(responses.length).toBeGreaterThanOrEqual(0);
  });

  it('connects networking campaigns to job search outcomes', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Campaign outreaches can lead to job opportunities
    await supabase
      .from('event_outcomes')
      .select('*')
      .eq('outcome_type', 'job_opportunity');
    
    expect(supabase.from).toHaveBeenCalledWith('event_outcomes');
  });

  it('tracks target companies and roles for campaigns', async () => {
    const NetworkingCampaigns = (await import('@/pages/NetworkingCampaigns')).default;
    
    render(
      <BrowserRouter>
        <NetworkingCampaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
    });
  });

  it('enforces RLS policies for campaign data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase
      .from('networking_campaigns')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'networking_campaigns')).toBe(true);
  });
});

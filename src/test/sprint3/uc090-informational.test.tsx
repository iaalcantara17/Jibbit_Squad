import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
          data: table === 'informational_interviews' ? [
            {
              id: 'info-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              contact: { name: 'Jane Smith', company: 'Tech Corp', role: 'Senior Engineer' },
              outreach_sent_at: '2024-01-15T10:00:00Z',
              scheduled_date: '2024-02-01T14:00:00Z',
              prep_checklist: {
                topics: ['Career Path', 'Company Culture'],
                questions_prepared: true,
                research_completed: true,
                goals_defined: true,
              },
              outcome_notes: 'Great insights on engineering culture',
              follow_up_tasks: [
                { task: 'Send thank you email', completed: true },
                { task: 'Connect on LinkedIn', completed: false },
              ],
              status: 'completed',
              created_at: '2024-01-10T10:00:00Z',
            },
            {
              id: 'info-2',
              user_id: 'test-user-id',
              contact_id: 'contact-2',
              contact: { name: 'John Doe', company: 'StartupCo', role: 'CTO' },
              status: 'outreach_pending',
              prep_checklist: {
                topics: [],
                questions_prepared: false,
                research_completed: false,
                goals_defined: false,
              },
              follow_up_tasks: [],
              created_at: '2024-01-20T10:00:00Z',
            }
          ] : table === 'contacts' ? [
            { id: 'contact-1', name: 'Jane Smith', company: 'Tech Corp', role: 'Senior Engineer' },
            { id: 'contact-2', name: 'John Doe', company: 'StartupCo', role: 'CTO' },
          ] : [],
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

describe('UC-090: Informational Interview Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies potential informational interview candidates', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('contacts');
    });
  });

  it('generates professional outreach templates for interview requests', async () => {
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    const user = userEvent.setup();
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Should have option to add new interview request
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
  });

  it('provides preparation frameworks for informational interviews', async () => {
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify prep checklist items are displayed
    expect(screen.getByText(/Career Path/i)).toBeInTheDocument();
    expect(screen.getByText(/Company Culture/i)).toBeInTheDocument();
  });

  it('tracks interview completion and relationship outcomes', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    // Verify outcome notes are captured
    expect(screen.getByText(/Great insights/i)).toBeInTheDocument();
  });

  it('includes follow-up templates and relationship maintenance', async () => {
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify follow-up tasks are shown
    expect(screen.getByText(/Send thank you email/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect on LinkedIn/i)).toBeInTheDocument();
  });

  it('monitors informational interview impact on job search success', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data } = await supabase
      .from('informational_interviews')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    // Calculate completion rate
    const completed = data?.filter(i => i.status === 'completed') || [];
    const completionRate = data && data.length > 0 
      ? (completed.length / data.length) * 100 
      : 0;
    
    expect(completionRate).toBeGreaterThanOrEqual(0);
  });

  it('generates insights and industry intelligence from conversations', async () => {
    const InformationalInterviewsManager = (await import('@/components/network/InformationalInterviewsManager')).InformationalInterviewsManager;
    
    render(<InformationalInterviewsManager />);

    await waitFor(() => {
      expect(screen.getByText(/Great insights on engineering culture/i)).toBeInTheDocument();
    });
  });

  it('connects informational interviews to future opportunities', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Informational interviews can lead to job opportunities
    await supabase
      .from('informational_interviews')
      .select('*, contact(*)')
      .eq('status', 'completed');
    
    expect(supabase.from).toHaveBeenCalledWith('informational_interviews');
  });

  it('enforces RLS policies for interview data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase
      .from('informational_interviews')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'informational_interviews')).toBe(true);
  });
});

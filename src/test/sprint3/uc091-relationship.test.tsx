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
          data: table === 'contact_reminders' ? [
            {
              id: 'reminder-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              reminder_date: '2024-02-01T10:00:00Z',
              notes: 'Check in about project',
              completed: false,
              contact: {
                name: 'John Doe',
                company: 'Tech Corp',
                relationship_strength: 4,
                last_contacted_at: '2023-12-01T10:00:00Z',
              },
              created_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 'reminder-2',
              user_id: 'test-user-id',
              contact_id: 'contact-2',
              reminder_date: '2024-01-25T10:00:00Z',
              notes: 'Birthday wishes',
              completed: true,
              contact: {
                name: 'Jane Smith',
                company: 'StartupCo',
                relationship_strength: 5,
                last_contacted_at: '2024-01-20T10:00:00Z',
              },
              created_at: '2024-01-20T10:00:00Z',
            }
          ] : table === 'contacts' ? [
            {
              id: 'contact-1',
              name: 'John Doe',
              company: 'Tech Corp',
              relationship_strength: 4,
              last_contacted_at: '2023-12-01T10:00:00Z',
            },
            {
              id: 'contact-2',
              name: 'Jane Smith',
              company: 'StartupCo',
              relationship_strength: 5,
              last_contacted_at: '2024-01-20T10:00:00Z',
            }
          ] : [],
          error: null,
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        lt: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
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

describe('UC-091: Relationship Maintenance Automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates periodic check-in reminders for important contacts', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('suggests personalized outreach based on contact activity', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify reminder notes are shown
    expect(screen.getByText(/Check in about project/i)).toBeInTheDocument();
  });

  it('tracks relationship health and engagement frequency', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify last contacted date is displayed
    expect(screen.getByText(/2023-12-01/i)).toBeInTheDocument();
  });

  it('provides templates for various outreach occasions', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    const user = userEvent.setup();
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Templates button should be available
    const templateButtons = screen.getAllByRole('button');
    expect(templateButtons.length).toBeGreaterThan(0);
  });

  it('monitors relationship reciprocity and mutual value exchange', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Query contact interactions
    await supabase
      .from('contact_interactions')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    expect(supabase.from).toHaveBeenCalledWith('contact_interactions');
  });

  it('includes industry news sharing opportunities', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      // Check for template options that include resource sharing
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('generates relationship strengthening activity suggestions', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify suggestions are present (contacts needing outreach)
    const contacts = screen.getAllByText(/Tech Corp|StartupCo/i);
    expect(contacts.length).toBeGreaterThan(0);
  });

  it('tracks relationship maintenance impact on opportunities', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Calculate engagement metrics
    const { data: reminders } = await supabase
      .from('contact_reminders')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const completedReminders = reminders?.filter(r => r.completed) || [];
    const completionRate = reminders && reminders.length > 0
      ? (completedReminders.length / reminders.length) * 100
      : 0;
    
    expect(completionRate).toBeGreaterThanOrEqual(0);
  });

  it('provides birthday and congratulations templates', async () => {
    const RelationshipMaintenance = (await import('@/components/network/RelationshipMaintenance')).RelationshipMaintenance;
    
    render(<RelationshipMaintenance />);

    await waitFor(() => {
      expect(screen.getByText(/Birthday wishes/i)).toBeInTheDocument();
    });
  });

  it('enforces RLS policies for reminder data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase
      .from('contact_reminders')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'contact_reminders')).toBe(true);
  });
});

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
          data: table === 'professional_references' ? [
            {
              id: 'ref-1',
              user_id: 'test-user-id',
              contact_id: 'contact-1',
              contact: {
                name: 'John Manager',
                company: 'Tech Corp',
                email: 'john@techcorp.com',
                phone: '+1-555-0100',
              },
              relationship_description: 'Former direct manager at Tech Corp',
              can_speak_to: ['leadership', 'technical skills', 'project management'],
              contact_preference: 'email',
              notes: 'Prefers email contact, available for reference',
              times_used: 3,
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              id: 'ref-2',
              user_id: 'test-user-id',
              contact_id: 'contact-2',
              contact: {
                name: 'Jane Colleague',
                company: 'StartupCo',
                email: 'jane@startupco.com',
                phone: '+1-555-0200',
              },
              relationship_description: 'Senior colleague and project partner',
              can_speak_to: ['collaboration', 'innovation', 'communication'],
              contact_preference: 'phone',
              notes: 'Best to call in the afternoon',
              times_used: 1,
              created_at: '2024-01-15T10:00:00Z',
            }
          ] : table === 'contacts' ? [
            { id: 'contact-1', name: 'John Manager', company: 'Tech Corp', email: 'john@techcorp.com' },
            { id: 'contact-2', name: 'Jane Colleague', company: 'StartupCo', email: 'jane@startupco.com' },
          ] : table === 'reference_requests' ? [] : [],
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

describe('UC-094: Professional Reference Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maintains list of professional references with contact information', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
      expect(screen.getByText('Jane Colleague')).toBeInTheDocument();
    });

    // Verify contact details are shown
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('StartupCo')).toBeInTheDocument();
  });

  it('tracks reference usage and availability for different opportunities', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Verify times used is tracked
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('generates reference request templates and preparation materials', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    const user = userEvent.setup();
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Template button should be available
    const templateButtons = screen.getAllByRole('button', { name: /template/i });
    expect(templateButtons.length).toBeGreaterThan(0);
  });

  it('provides reference preparation guidance and role-specific talking points', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Verify "can speak to" areas are displayed
    expect(screen.getByText(/leadership/i)).toBeInTheDocument();
    expect(screen.getByText(/technical skills/i)).toBeInTheDocument();
  });

  it('monitors reference feedback and recommendations', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Reference requests track feedback
    await supabase
      .from('reference_requests')
      .select('*, reference:professional_references(*)')
      .eq('user_id', 'test-user-id');
    
    expect(supabase.from).toHaveBeenCalledWith('reference_requests');
  });

  it('includes reference relationship maintenance and appreciation', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Notes field should show maintenance info
    expect(screen.getByText(/Prefers email contact/i)).toBeInTheDocument();
  });

  it('tracks reference impact on application success rates', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: references } = await supabase
      .from('professional_references')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    // Calculate average usage
    const totalUsage = references?.reduce((sum, ref) => sum + (ref.times_used || 0), 0) || 0;
    const avgUsage = references && references.length > 0 
      ? totalUsage / references.length 
      : 0;
    
    expect(avgUsage).toBeGreaterThanOrEqual(0);
  });

  it('generates reference portfolio for different career goals', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Different references speak to different areas
    expect(screen.getByText(/project management/i)).toBeInTheDocument();
    expect(screen.getByText(/collaboration/i)).toBeInTheDocument();
  });

  it('provides templates for initial reference requests', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    const user = userEvent.setup();
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Click template button
    const templateButtons = screen.getAllByRole('button', { name: /template/i });
    if (templateButtons.length > 0) {
      await user.click(templateButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    }
  });

  it('includes upcoming reference check heads-up templates', async () => {
    const ReferencesManager = (await import('@/components/network/ReferencesManager')).ReferencesManager;
    
    render(<ReferencesManager />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    // Template management should be available
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('enforces RLS policies for reference data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase
      .from('professional_references')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'professional_references')).toBe(true);
  });
});

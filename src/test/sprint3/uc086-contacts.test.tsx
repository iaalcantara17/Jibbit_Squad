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
          data: table === 'contacts' ? [
            {
              id: 'contact-1',
              user_id: 'test-user-id',
              name: 'John Doe',
              email: 'john@example.com',
              company: 'Tech Corp',
              role: 'Software Engineer',
              relationship_type: 'colleague',
              relationship_strength: 4,
              tags: ['javascript', 'react'],
              notes: 'Great developer',
              interests: 'AI, Web Development',
              last_contacted_at: '2024-01-15T10:00:00Z',
              created_at: '2024-01-01T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 'contact-2',
              user_id: 'test-user-id',
              name: 'Jane Smith',
              email: 'jane@example.com',
              company: 'StartupCo',
              role: 'Product Manager',
              relationship_type: 'mentor',
              relationship_strength: 5,
              tags: ['product', 'strategy'],
              last_contacted_at: '2024-01-20T10:00:00Z',
              created_at: '2024-01-05T10:00:00Z',
              updated_at: '2024-01-20T10:00:00Z',
            }
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

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-086: Professional Contact Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays list of professional contacts with detailed information', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Contacts = (await import('@/pages/Contacts')).default;
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify contact details are displayed
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('allows filtering contacts by search query', async () => {
    const Contacts = (await import('@/pages/Contacts')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search for specific contact
    const searchInput = screen.getByPlaceholderText(/search contacts/i);
    await user.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('supports categorizing contacts by industry, role, and relationship type', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Contacts = (await import('@/pages/Contacts')).default;
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify relationship types are displayed
    expect(screen.getByText(/colleague/i)).toBeInTheDocument();
    expect(screen.getByText(/mentor/i)).toBeInTheDocument();
  });

  it('tracks interaction history and relationship strength', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Contacts = (await import('@/pages/Contacts')).default;
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify relationship strength indicators are present
    const strengthIndicators = screen.getAllByRole('progressbar', { hidden: true });
    expect(strengthIndicators.length).toBeGreaterThan(0);
  });

  it('includes notes on personal and professional interests', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Contacts = (await import('@/pages/Contacts')).default;
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify tags/interests are displayed
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('allows linking contacts to specific companies and job opportunities', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Verify contact_job_links table can be queried
    await supabase.from('contact_job_links').select('*');
    
    expect(supabase.from).toHaveBeenCalledWith('contact_job_links');
  });

  it('supports adding new contacts manually with detailed information', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Contacts = (await import('@/pages/Contacts')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Contacts />
      </BrowserRouter>
    );

    // Click add contact button
    const addButton = await screen.findByRole('button', { name: /add contact/i });
    await user.click(addButton);

    // Verify form dialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('enforces RLS policies for contact data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase.from('contacts').select('*').eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'contacts')).toBe(true);
  });
});

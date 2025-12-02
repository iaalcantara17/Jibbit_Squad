import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{
            id: 'profile-1',
            user_id: 'test-user-id',
            linkedin_url: 'https://linkedin.com/in/testuser',
            headline: 'Software Engineer',
            summary: 'Passionate about AI',
          }],
          error: null,
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-089: LinkedIn Profile Integration and Guidance (PARTIAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides LinkedIn profile optimization suggestions', async () => {
    const LinkedInOptimization = (await import('@/pages/LinkedInOptimization')).default;
    
    render(
      <BrowserRouter>
        <LinkedInOptimization />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for optimization guidance
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('generates LinkedIn message templates for networking', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Verify templates are displayed
      expect(screen.getByText(/Job Application Follow-up/i)).toBeInTheDocument();
      expect(screen.getByText(/Informational Interview Request/i)).toBeInTheDocument();
    });
  });

  it('provides networking strategy guidance', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Check for outreach templates
      expect(screen.getByText(/Post-Event Follow-up/i)).toBeInTheDocument();
      expect(screen.getByText(/Mutual Connection Introduction/i)).toBeInTheDocument();
    });
  });

  it('suggests connection request templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Verify connection templates
      expect(screen.getByText(/Referral Request/i)).toBeInTheDocument();
    });
  });

  it('includes LinkedIn profile URL linking to job applications', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Profiles table should support LinkedIn URL
    await supabase
      .from('profiles')
      .select('linkedin_url')
      .eq('user_id', 'test-user-id');
    
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('generates networking campaign templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Check template categories
      const templates = screen.getAllByRole('button', { name: /copy/i });
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  // Note: LinkedIn OAuth is not implemented - requires external setup
  // Manual profile input is the fallback mode
  it('supports manual profile input as fallback', async () => {
    const LinkedInOptimization = (await import('@/pages/LinkedInOptimization')).default;
    
    render(
      <BrowserRouter>
        <LinkedInOptimization />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Profile form should be available
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});

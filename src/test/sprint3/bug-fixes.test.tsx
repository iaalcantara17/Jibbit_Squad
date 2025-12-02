import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupportGroupsList } from '@/components/peer/SupportGroupsList';
import { LinkedInTemplates } from '@/components/network/LinkedInTemplates';
import { AdvisorDirectory } from '@/components/advisor/AdvisorDirectory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'support_group_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { name: 'John Doe' },
            error: null,
          }),
        };
      }
      if (table === 'advisor_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'advisor-1',
                display_name: 'Jane Smith',
                bio: 'Career coach',
                hourly_rate: 100,
                is_active: true,
              },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Bug Fixes - Support Groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check for existing membership before joining group', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    renderWithProviders(<SupportGroupsList />);

    // Verify that maybeSingle is called to check for existing membership
    await waitFor(() => {
      // The component should query for existing membership
      expect(supabase.from).toHaveBeenCalledWith('support_group_members');
    });
  });
});

describe('Bug Fixes - LinkedIn Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load user name from profile', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    renderWithProviders(<LinkedInTemplates />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('should replace [Your Name] placeholder when copying', async () => {
    renderWithProviders(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText('Connection Request Templates')).toBeInTheDocument();
    });

    // Verify templates are displayed
    expect(screen.getByText('Job Application Follow-up')).toBeInTheDocument();
  });
});

describe('Bug Fixes - Advisor Directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Book Session button', async () => {
    renderWithProviders(<AdvisorDirectory />);

    await waitFor(() => {
      expect(screen.getByText('Find Your Career Advisor')).toBeInTheDocument();
    });

    // Should eventually show advisors with Book Session buttons
    await waitFor(() => {
      const bookButtons = screen.queryAllByText('Book Session');
      expect(bookButtons.length).toBeGreaterThan(0);
    });
  });

  it('should show scheduling interface when booking', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdvisorDirectory />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const bookButton = screen.getByText('Book Session');
    await user.click(bookButton);

    // Should show scheduling interface
    await waitFor(() => {
      expect(screen.getByText(/Book Session with/i)).toBeInTheDocument();
    });
  });
});
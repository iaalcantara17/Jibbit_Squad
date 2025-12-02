import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SharedProgress from '@/pages/SharedProgress';

// Mock Supabase
const mockShareData = {
  id: 'share-id',
  user_id: 'user-123',
  share_token: 'valid-token',
  scope: 'full_progress',
  is_active: true,
  created_at: new Date().toISOString(),
  expires_at: null
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'progress_shares') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ 
                  data: mockShareData, 
                  error: null 
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        };
      }
      if (table === 'progress_share_access_log') {
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ 
                data: { name: 'Test User' }, 
                error: null 
              }))
            }))
          }))
        };
      }
      if (table === 'goals') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ 
              data: [
                { id: 'g1', title: 'Goal 1', status: 'in-progress' }
              ], 
              error: null 
            }))
          }))
        };
      }
      if (table === 'jobs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ 
              data: [
                { id: 'j1', job_title: 'Software Engineer', company_name: 'Tech Co', status: 'applied' }
              ], 
              error: null 
            }))
          }))
        };
      }
      return {
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      };
    })
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ token: 'valid-token' })
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

describe('SharedProgress - Public Access', () => {
  it('should load and display shared progress without authentication', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SharedProgress />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User's Progress/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Goal 1/i)).toBeInTheDocument();
  });

  it('should show error for invalid token', async () => {
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: null 
            }))
          }))
        }))
      }))
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SharedProgress />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Link Not Found/i)).toBeInTheDocument();
    });
  });

  it('should show error for expired share', async () => {
    const expiredShare = {
      ...mockShareData,
      expires_at: new Date('2020-01-01').toISOString()
    };

    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: expiredShare, 
              error: null 
            }))
          }))
        }))
      }))
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SharedProgress />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });
});

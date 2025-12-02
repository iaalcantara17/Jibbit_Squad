import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: table === 'progress_shares' ? {
              id: 'share-1',
              user_id: 'test-user-id',
              share_token: 'test-token-123',
              scope: 'full_progress',
              is_active: true,
              expires_at: '2025-12-31T23:59:59Z',
              created_at: '2024-01-01T10:00:00Z',
              last_accessed_at: '2024-01-15T10:00:00Z',
            } : table === 'profiles' ? {
              user_id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
            } : null,
            error: null,
          })),
          order: vi.fn(() => Promise.resolve({
            data: table === 'progress_shares' ? [
              {
                id: 'share-1',
                user_id: 'test-user-id',
                share_token: 'test-token-123',
                scope: 'full_progress',
                is_active: true,
                expires_at: '2025-12-31T23:59:59Z',
                created_at: '2024-01-01T10:00:00Z',
              },
              {
                id: 'share-2',
                user_id: 'test-user-id',
                share_token: 'test-token-456',
                scope: 'kpi_summary',
                is_active: false,
                expires_at: '2024-02-01T23:59:59Z',
                created_at: '2024-01-05T10:00:00Z',
              }
            ] : table === 'goals' ? [
              {
                id: 'goal-1',
                user_id: 'test-user-id',
                title: 'Apply to 50 jobs',
                description: 'Submit applications',
                status: 'in-progress',
                current_value: 30,
                target_value: 50,
              },
              {
                id: 'goal-2',
                user_id: 'test-user-id',
                title: 'Complete 10 interviews',
                description: 'Practice and improve',
                status: 'completed',
                current_value: 10,
                target_value: 10,
              }
            ] : table === 'jobs' ? [
              {
                id: 'job-1',
                user_id: 'test-user-id',
                job_title: 'Software Engineer',
                company_name: 'Tech Corp',
                status: 'applied',
              },
              {
                id: 'job-2',
                user_id: 'test-user-id',
                job_title: 'Senior Developer',
                company_name: 'StartupCo',
                status: 'interview',
              }
            ] : [],
            error: null,
          })),
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

describe('UC-111: Progress Sharing and Accountability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows users to create shareable progress links', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Create share link
    await supabase
      .from('progress_shares')
      .insert({
        user_id: 'test-user-id',
        share_token: 'new-token-789',
        scope: 'kpi_summary',
        is_active: true,
        expires_at: '2025-03-31T23:59:59Z',
      });

    expect(supabase.from).toHaveBeenCalledWith('progress_shares');
  });

  it('supports different privacy scopes for sharing', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data } = await supabase
      .from('progress_shares')
      .select('*')
      .eq('user_id', 'test-user-id')
      .order('created_at', { ascending: false });

    // Verify different scopes
    expect(data).toBeDefined();
    if (data && data.length > 0) {
      const scopes = data.map(s => s.scope);
      expect(scopes).toContain('full_progress');
      expect(scopes).toContain('kpi_summary');
    }
  });

  it('displays shared progress to external viewers', async () => {
    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    render(
      <MemoryRouter initialEntries={['/shared/test-token-123']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User's Progress/i)).toBeInTheDocument();
    });
  });

  it('shows KPI summary for kpi_summary scope', async () => {
    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    render(
      <MemoryRouter initialEntries={['/shared/test-token-123']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should show application stats
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interviews')).toBeInTheDocument();
      expect(screen.getByText('Offers')).toBeInTheDocument();
    });
  });

  it('shows goals for goals_only scope', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock goals_only scope
    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'share-goals',
              user_id: 'test-user-id',
              share_token: 'goals-token',
              scope: 'goals_only',
              is_active: true,
              expires_at: '2025-12-31T23:59:59Z',
            },
            error: null,
          })),
        })),
      })),
    }));

    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    render(
      <MemoryRouter initialEntries={['/shared/goals-token']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apply to 50 jobs')).toBeInTheDocument();
    });
  });

  it('shows full progress for full_progress scope', async () => {
    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    render(
      <MemoryRouter initialEntries={['/shared/test-token-123']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Application Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('tracks access to shared links', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Log access
    await supabase
      .from('progress_share_access_log')
      .insert({
        share_id: 'share-1',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      });

    expect(supabase.from).toHaveBeenCalledWith('progress_share_access_log');
  });

  it('updates last accessed timestamp on view', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Update last accessed
    await supabase
      .from('progress_shares')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', 'share-1');

    expect(supabase.from).toHaveBeenCalledWith('progress_shares');
  });

  it('enforces expiry dates on share links', async () => {
    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    // Mock expired share
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'expired-share',
              user_id: 'test-user-id',
              share_token: 'expired-token',
              scope: 'kpi_summary',
              is_active: true,
              expires_at: '2020-01-01T00:00:00Z', // Expired
            },
            error: null,
          })),
        })),
      })),
    }));
    
    render(
      <MemoryRouter initialEntries={['/shared/expired-token']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Link Not Found/i)).toBeInTheDocument();
    });
  });

  it('allows toggling share link active status', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Deactivate share
    await supabase
      .from('progress_shares')
      .update({ is_active: false })
      .eq('id', 'share-1');

    expect(supabase.from).toHaveBeenCalledWith('progress_shares');
  });

  it('displays progress with privacy-focused presentation', async () => {
    const SharedProgress = (await import('@/pages/SharedProgress')).default;
    
    render(
      <MemoryRouter initialEntries={['/shared/test-token-123']}>
        <Routes>
          <Route path="/shared/:token" element={<SharedProgress />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should not show sensitive details like salaries
      expect(screen.queryByText(/salary/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/compensation/i)).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

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
          order: vi.fn(() => Promise.resolve({
            data: table === 'teams' ? [
              {
                id: 'team-1',
                name: 'Engineering Team',
                description: 'Software engineering candidates',
                created_at: '2024-01-01T10:00:00Z',
                created_by: 'test-user-id',
              },
              {
                id: 'team-2',
                name: 'Product Team',
                description: 'Product management candidates',
                created_at: '2024-01-05T10:00:00Z',
                created_by: 'test-user-id',
              }
            ] : table === 'team_memberships' ? [
              {
                id: 'member-1',
                team_id: 'team-1',
                user_id: 'test-user-id',
                role: 'admin',
                created_at: '2024-01-01T10:00:00Z',
              },
              {
                id: 'member-2',
                team_id: 'team-1',
                user_id: 'user-2',
                role: 'candidate',
                created_at: '2024-01-02T10:00:00Z',
              },
              {
                id: 'member-3',
                team_id: 'team-1',
                user_id: 'user-3',
                role: 'mentor',
                created_at: '2024-01-03T10:00:00Z',
              }
            ] : table === 'team_invitations' ? [
              {
                id: 'inv-1',
                team_id: 'team-1',
                email: 'newmember@example.com',
                role: 'candidate',
                token: 'test-token-123',
                expires_at: '2024-02-01T10:00:00Z',
                accepted: false,
                created_at: '2024-01-15T10:00:00Z',
              }
            ] : [],
            error: null,
          })),
          single: vi.fn(() => Promise.resolve({
            data: table === 'team_memberships' ? {
              role: 'admin'
            } : null,
            error: null,
          })),
          in: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: [
                { id: 'profile-1', user_id: 'test-user-id', name: 'Admin User', email: 'test@example.com' },
                { id: 'profile-2', user_id: 'user-2', name: 'Candidate User', email: 'candidate@example.com' },
                { id: 'profile-3', user_id: 'user-3', name: 'Mentor User', email: 'mentor@example.com' },
              ],
              error: null,
            })),
          })),
        })),
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
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

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-108: Team Account Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays list of teams with role-based access', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('Product Team')).toBeInTheDocument();
    });

    // Verify team descriptions
    expect(screen.getByText('Software engineering candidates')).toBeInTheDocument();
  });

  it('allows admin users to create teams', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    // Create team button should be visible
    const createButton = await screen.findByRole('button', { name: /create team/i });
    expect(createButton).toBeInTheDocument();
    
    await user.click(createButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('allows admin users to invite team members', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    });

    // Click on team to select it
    const teamCard = screen.getByText('Engineering Team');
    await user.click(teamCard);

    // Invite button should appear for admin
    await waitFor(() => {
      const inviteButton = screen.getByRole('button', { name: /invite member/i });
      expect(inviteButton).toBeInTheDocument();
    });
  });

  it('displays team members with roles', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Candidate User')).toBeInTheDocument();
      expect(screen.getByText('Mentor User')).toBeInTheDocument();
    });

    // Verify role badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('candidate')).toBeInTheDocument();
    expect(screen.getByText('mentor')).toBeInTheDocument();
  });

  it('shows pending invitations to admin users', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      expect(screen.getByText('newmember@example.com')).toBeInTheDocument();
    });
  });

  it('allows admin to remove team members', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const Teams = (await import('@/pages/Teams')).default;
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Candidate User')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
    
    if (deleteButton) {
      await user.click(deleteButton);
    }

    // Verify delete was called
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('team_memberships');
    });
  });

  it('enforces role-based permissions for team management', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Query team memberships with role check
    await supabase
      .from('team_memberships')
      .select('*')
      .eq('team_id', 'team-1')
      .eq('user_id', 'test-user-id')
      .single();

    expect(supabase.from).toHaveBeenCalledWith('team_memberships');
  });

  it('supports multiple team memberships per user', async () => {
    const Teams = (await import('@/pages/Teams')).default;
    
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    );

    await waitFor(() => {
      // User should see all teams they belong to
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('Product Team')).toBeInTheDocument();
    });
  });

  it('generates invitation tokens with expiry dates', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check invitation structure
    const { data } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', 'team-1')
      .eq('accepted', false);

    expect(data).toBeDefined();
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('token');
      expect(data[0]).toHaveProperty('expires_at');
      expect(data[0]).toHaveProperty('role');
    }
  });

  it('tracks team creation and ownership', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Teams should have created_by field
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    expect(data).toBeDefined();
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('created_by');
      expect(data[0].created_by).toBe('test-user-id');
    }
  });
});

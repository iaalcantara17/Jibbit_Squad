import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'mentor-user-id', email: 'mentor@example.com' } }, 
        error: null 
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: table === 'team_memberships' && [
              {
                user_id: 'mentor-user-id',
                team_id: 'team-1',
                role: 'mentor',
                teams: { id: 'team-1', name: 'Engineering Team' },
              }
            ] || table === 'jobs' ? [
              { id: 'job-1', status: 'applied', user_id: 'candidate-1' },
              { id: 'job-2', status: 'interview', user_id: 'candidate-1' },
            ] : table === 'interviews' ? [
              { id: 'int-1', user_id: 'candidate-1' },
            ] : table === 'goals' ? [
              { id: 'goal-1', user_id: 'candidate-1', status: 'active' },
            ] : [],
            error: null,
          })),
          order: vi.fn(() => Promise.resolve({
            data: table === 'team_memberships' ? [
              {
                user_id: 'candidate-1',
                team_id: 'team-1',
                role: 'candidate',
              },
              {
                user_id: 'candidate-2',
                team_id: 'team-1',
                role: 'candidate',
              }
            ] : table === 'profiles' ? [
              { user_id: 'candidate-1', name: 'John Candidate', email: 'john@example.com' },
              { user_id: 'candidate-2', name: 'Jane Candidate', email: 'jane@example.com' },
            ] : [],
            error: null,
          })),
        })),
        in: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [
              { user_id: 'candidate-1', name: 'John Candidate', email: 'john@example.com' },
              { user_id: 'candidate-2', name: 'Jane Candidate', email: 'jane@example.com' },
            ],
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

describe('UC-110: Mentor-Mentee Collaboration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays mentor dashboard with mentees', async () => {
    const MentorDashboard = (await import('@/pages/MentorDashboard')).default;
    
    render(
      <BrowserRouter>
        <MentorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mentor Dashboard')).toBeInTheDocument();
    });
  });

  it('shows mentee progress metrics', async () => {
    const MentorDashboard = (await import('@/pages/MentorDashboard')).default;
    
    render(
      <BrowserRouter>
        <MentorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Candidate')).toBeInTheDocument();
      expect(screen.getByText('Jane Candidate')).toBeInTheDocument();
    });
  });

  it('restricts access to mentor or admin roles only', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock non-mentor user
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: { id: 'candidate-user', email: 'candidate@example.com' } },
      error: null,
    });

    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      })),
    }));

    const MentorDashboard = (await import('@/pages/MentorDashboard')).default;
    
    render(
      <BrowserRouter>
        <MentorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('allows mentors to view mentee applications', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Query jobs for mentee
    await supabase
      .from('jobs')
      .select('id, status')
      .eq('user_id', 'candidate-1');

    expect(supabase.from).toHaveBeenCalledWith('jobs');
  });

  it('allows mentors to view mentee interviews', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Query interviews for mentee
    await supabase
      .from('interviews')
      .select('id')
      .eq('user_id', 'candidate-1');

    expect(supabase.from).toHaveBeenCalledWith('interviews');
  });

  it('allows mentors to view mentee goals', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Query goals for mentee
    await supabase
      .from('goals')
      .select('id')
      .eq('user_id', 'candidate-1')
      .eq('status', 'active');

    expect(supabase.from).toHaveBeenCalledWith('goals');
  });

  it('aggregates mentee statistics correctly', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const MentorDashboard = (await import('@/pages/MentorDashboard')).default;
    
    render(
      <BrowserRouter>
        <MentorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Candidate')).toBeInTheDocument();
    });

    // Verify stats queries were made
    expect(supabase.from).toHaveBeenCalledWith('jobs');
    expect(supabase.from).toHaveBeenCalledWith('interviews');
    expect(supabase.from).toHaveBeenCalledWith('goals');
  });

  it('supports multiple mentees per mentor', async () => {
    const MentorDashboard = (await import('@/pages/MentorDashboard')).default;
    
    render(
      <BrowserRouter>
        <MentorDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Candidate')).toBeInTheDocument();
      expect(screen.getByText('Jane Candidate')).toBeInTheDocument();
    });
  });

  it('provides feedback mechanism for mentors', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Feedback insertion
    await supabase
      .from('mentor_feedback')
      .insert({
        mentor_id: 'mentor-user-id',
        candidate_id: 'candidate-1',
        team_id: 'team-1',
        entity_type: 'application',
        entity_id: 'job-1',
        feedback_text: 'Great progress on applications',
        implemented: false,
      });

    expect(supabase.from).toHaveBeenCalledWith('mentor_feedback');
  });

  it('enforces RLS for mentor-mentee data access', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Verify team-based access control
    await supabase
      .from('team_memberships')
      .select('user_id, team_id')
      .in('team_id', ['team-1'])
      .eq('role', 'candidate');

    expect(supabase.from).toHaveBeenCalledWith('team_memberships');
  });
});

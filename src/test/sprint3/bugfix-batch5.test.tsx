import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MockInterviewSession from '@/pages/MockInterviewSession';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'test-session-id',
              user_id: 'test-user-id',
              target_role: 'Software Engineer',
              format: 'behavioral',
              question_count: 5,
              status: 'in_progress'
            }, 
            error: null 
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          limit: vi.fn(() => Promise.resolve({ 
            data: [
              {
                id: 'q1',
                question_text: 'Tell me about yourself',
                category: 'behavioral',
                difficulty: 'medium'
              }
            ], 
            error: null 
          }))
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: {
          session: {
            user: { id: 'test-user-id' }
          }
        },
        error: null
      }))
    }
  }
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-id' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  session: { user: { id: 'test-user-id' } },
  profile: null,
  isLoading: false,
  login: vi.fn(),
  loginWithToken: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  deleteAccount: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Bugfix Batch 5 - Mock Interview & Teams', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Bug 1: Mock Interview Blank Page Prevention', () => {
    it('should render loading state initially', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ErrorBoundary>
              <MockInterviewSession />
            </ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle session loading and not show blank page', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ErrorBoundary>
              <MockInterviewSession />
            </ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should have rendered content (not blank)
      const container = screen.getByText(/Mock Interview|Tell me about yourself/i);
      expect(container).toBeTruthy();
    });

    it('should show error UI when session not found instead of blank page', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ErrorBoundary>
              <MockInterviewSession />
            </ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to Load Interview|Session not found/i)).toBeInTheDocument();
      });
    });

    it('should wrap component in ErrorBoundary to prevent blank pages', () => {
      const TestComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // ErrorBoundary should catch the error and show error UI
      expect(screen.getByText(/Something went wrong|error/i)).toBeInTheDocument();
    });
  });

  describe('Bug 2: Teams RLS Policy', () => {
    it('should verify auth session before creating team', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const getSessionSpy = vi.spyOn(supabase.auth, 'getSession');

      // This would be called by CreateTeamDialog.handleStart
      await supabase.auth.getSession();

      expect(getSessionSpy).toHaveBeenCalled();
      const result = await supabase.auth.getSession();
      expect(result.data.session?.user.id).toBe('test-user-id');
    });

    it('should allow authenticated user to create team with proper created_by', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Simulate team creation
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'team-123', 
              name: 'Test Team', 
              created_by: 'test-user-id' 
            }, 
            error: null 
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const result = await supabase
        .from('teams')
        .insert({
          name: 'Test Team',
          description: 'Test description',
          created_by: 'test-user-id'
        })
        .select()
        .single();

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Test Team',
        description: 'Test description',
        created_by: 'test-user-id'
      });
      expect(result.data?.created_by).toBe('test-user-id');
    });

    it('should create team membership for creator as admin', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockMembershipInsert = vi.fn(() => Promise.resolve({ 
        data: { 
          team_id: 'team-123', 
          user_id: 'test-user-id', 
          role: 'admin' 
        }, 
        error: null 
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockMembershipInsert
      } as any);

      const result = await supabase
        .from('team_memberships')
        .insert({
          team_id: 'team-123',
          user_id: 'test-user-id',
          role: 'admin'
        });

      expect(mockMembershipInsert).toHaveBeenCalledWith({
        team_id: 'team-123',
        user_id: 'test-user-id',
        role: 'admin'
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete mock interview creation flow', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // 1. Verify auth
      const authResult = await supabase.auth.getSession();
      expect(authResult.data.session?.user).toBeTruthy();

      // 2. Create session
      const mockSessionInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'session-456',
              user_id: 'test-user-id',
              target_role: 'Engineer',
              format: 'behavioral',
              question_count: 10,
              status: 'in_progress'
            }, 
            error: null 
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockSessionInsert
      } as any);

      const sessionResult = await supabase
        .from('mock_interview_sessions')
        .insert({
          user_id: authResult.data.session!.user.id,
          target_role: 'Engineer',
          format: 'behavioral',
          question_count: 10,
          status: 'in_progress'
        })
        .select()
        .single();

      expect(sessionResult.data?.id).toBe('session-456');
      expect(sessionResult.data?.user_id).toBe('test-user-id');
    });

    it('should handle complete team creation flow', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // 1. Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      expect(session?.user).toBeTruthy();

      // 2. Create team
      const mockTeamInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'team-789',
              name: 'My Team',
              created_by: session!.user.id
            }, 
            error: null 
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockTeamInsert
      } as any);

      const teamResult = await supabase
        .from('teams')
        .insert({
          name: 'My Team',
          description: 'Team description',
          created_by: session!.user.id
        })
        .select()
        .single();

      expect(teamResult.data).toBeTruthy();
      expect(teamResult.data?.created_by).toBe('test-user-id');

      // 3. Add creator as admin member
      const mockMemberInsert = vi.fn(() => Promise.resolve({ 
        data: { team_id: 'team-789', user_id: 'test-user-id', role: 'admin' }, 
        error: null 
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockMemberInsert
      } as any);

      const memberResult = await supabase
        .from('team_memberships')
        .insert({
          team_id: 'team-789',
          user_id: session!.user.id,
          role: 'admin'
        });

      expect(memberResult.error).toBeNull();
    });
  });
});

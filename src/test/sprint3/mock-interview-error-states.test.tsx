import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MockInterviewSession from '@/pages/MockInterviewSession';
import { AuthContext } from '@/contexts/AuthContext';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-id' }),
    useNavigate: () => vi.fn()
  };
});

const mockAuthContext: any = {
  user: { id: 'test-user-id', email: 'test@test.com' },
  session: null,
  profile: null,
  isLoading: false,
  loading: false,
  login: vi.fn(),
  loginWithToken: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  deleteAccount: vi.fn(),
  refreshProfile: vi.fn()
};

describe('MockInterviewSession - Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show error state when session not found', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })
        })
      })
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <MockInterviewSession />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to Load Interview/i)).toBeInTheDocument();
    });
  });

  it('should show error state when no questions available', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    let callCount = 0;
    (supabase.from as any).mockImplementation((table: string) => {
      callCount++;
      if (table === 'mock_interview_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn(() => Promise.resolve({ 
                  data: {
                    id: 'test-session',
                    user_id: 'test-user-id',
                    format: 'behavioral',
                    target_role: 'Software Engineer',
                    question_count: 5
                  },
                  error: null 
                }))
              })
            })
          })
        };
      }
      // For question_bank_items queries, return empty
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }),
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })
      };
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <MockInterviewSession />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No questions available/i)).toBeInTheDocument();
    });
  });

  it('should provide navigation options in error states', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })
        })
      })
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <MockInterviewSession />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Back to Interview Prep/i)).toBeInTheDocument();
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });
});

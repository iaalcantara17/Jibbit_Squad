import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MockInterviewSession from '@/pages/MockInterviewSession';
import { AuthContext } from '@/contexts/AuthContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

// Mock useParams
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

describe('MockInterviewSession - Blank Page Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <MockInterviewSession />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should show error message when session not found instead of blank page', async () => {
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

  it('should not crash when questions array is empty', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <MockInterviewSession />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    });

    // Should show some content, not be blank
    expect(container.textContent).toBeTruthy();
  });
});

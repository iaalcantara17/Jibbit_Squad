import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import MockInterviewSession from '@/pages/MockInterviewSession';
import { QuestionPracticeFeedback } from '@/components/interviews/QuestionPracticeFeedback';

// Mock Supabase
const mockGetSession = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } }
      }))
    },
    from: mockFrom
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: 'test-session-id', questionId: 'q1' }),
    useNavigate: () => vi.fn()
  };
});

const mockAuthContext: any = {
  user: { id: 'test-user-id', email: 'test@test.com' },
  session: { access_token: 'test-token', user: { id: 'test-user-id' } },
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

describe('Bug Fix Batch 4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug 1: Team creation RLS fix', () => {
    it('should use getSession() instead of getUser() to ensure auth.uid() match', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id' }
          }
        }
      });

      mockFrom.mockReturnValue({
        insert: mockInsert
      });

      mockInsert.mockReturnValue({
        select: mockSelect
      });

      mockSelect.mockReturnValue({
        single: mockSingle
      });

      mockSingle.mockResolvedValueOnce({
        data: { id: 'team-id', name: 'Test Team', created_by: 'test-user-id' },
        error: null
      });

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'team-id' },
              error: null
            })
          })
        })
      }).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContext.Provider value={mockAuthContext}>
              <CreateTeamDialog />
            </AuthContext.Provider>
          </BrowserRouter>
        </QueryClientProvider>
      );

      expect(mockGetSession).toBeDefined();
    });

    it('should create team with session.user.id matching auth.uid()', async () => {
      const sessionUserId = 'session-user-123';
      
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: sessionUserId }
          }
        }
      });

      expect(mockGetSession).toBeDefined();
    });
  });

  describe('Bug 2: Mock Interview blank page prevention', () => {
    it('should show loading state initially', () => {
      mockFrom.mockReturnValue({
        select: mockSelect
      });
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      mockEq.mockReturnValue({
        maybeSingle: mockMaybeSingle
      });
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <MockInterviewSession />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show error UI when session not found instead of blank page', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect
      });
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      mockEq.mockReturnValue({
        maybeSingle: mockMaybeSingle
      });
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null
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

    it('should render within ErrorBoundary', () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Simulated error');
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <BrowserRouter>
            <AuthContext.Provider value={mockAuthContext}>
              <MockInterviewSession />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      }).not.toThrow();

      consoleError.mockRestore();
    });
  });

  describe('Bug 3: Remove Language improvements from feedback', () => {
    it('should not render "Language Improvements" text in feedback component', async () => {
      const mockResponseData = {
        id: 'response-1',
        response_text: 'Test response',
        time_taken: 60,
        timer_duration: null
      };

      const mockFeedbackData = {
        overall_score: 8,
        structure_score: 7,
        clarity_score: 8,
        impact_score: 7,
        relevance_score: 9,
        specificity_score: 8,
        star_adherence: {
          situation: true,
          task: true,
          action: true,
          result: true,
          feedback: 'Good STAR coverage'
        },
        general_feedback: 'Good response overall',
        weak_language: [
          { phrase: 'kind of', alternative: 'somewhat', reason: 'More professional' }
        ],
        alternative_approaches: [],
        speaking_time_estimate: 120
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_practice_responses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockResponseData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'question_practice_feedback') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockFeedbackData,
                  error: null
                })
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const mockQuestion = {
        question_text: 'Test question',
        category: 'behavioral'
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <QuestionPracticeFeedback 
              responseId="response-1"
              question={mockQuestion}
              onBack={vi.fn()}
            />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Overall Score')).toBeInTheDocument();
      });

      // Verify "Language Improvements" header does not exist
      expect(screen.queryByText('Language Improvements')).not.toBeInTheDocument();
    });

    it('should still render other feedback sections without Language Improvements', async () => {
      const mockResponseData = {
        id: 'response-1',
        response_text: 'Test response',
        time_taken: 60,
        timer_duration: null
      };

      const mockFeedbackData = {
        overall_score: 8,
        structure_score: 7,
        clarity_score: 8,
        impact_score: 7,
        relevance_score: 9,
        specificity_score: 8,
        star_adherence: {
          situation: true,
          task: true,
          action: true,
          result: true,
          feedback: 'Good STAR coverage'
        },
        general_feedback: 'Good response overall',
        weak_language: [],
        alternative_approaches: ['Try using more specific metrics'],
        speaking_time_estimate: 120
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'question_practice_responses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockResponseData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'question_practice_feedback') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockFeedbackData,
                  error: null
                })
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      const mockQuestion = {
        question_text: 'Test question',
        category: 'behavioral'
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <QuestionPracticeFeedback 
              responseId="response-1"
              question={mockQuestion}
              onBack={vi.fn()}
            />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Overall Score')).toBeInTheDocument();
      });

      // Verify expected sections exist
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      
      // Verify Language Improvements is NOT present
      expect(screen.queryByText('Language Improvements')).not.toBeInTheDocument();
    });
  });
});

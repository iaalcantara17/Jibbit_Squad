import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionPractice from '@/pages/QuestionPractice';
import { AuthContext } from '@/contexts/AuthContext';

// Mock Supabase
const mockInvoke = vi.fn();
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({ 
      data: { id: 'response-id' }, 
      error: null 
    }))
  }))
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'question_bank_items') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'q1',
                  question_text: 'Test question',
                  category: 'behavioral',
                  difficulty: 'medium',
                  role_title: 'Software Engineer'
                },
                error: null
              }))
            }))
          }))
        };
      }
      if (table === 'question_practice_responses') {
        return {
          insert: mockInsert
        };
      }
      if (table === 'question_practice_feedback') {
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    }),
    functions: {
      invoke: mockInvoke
    },
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: { access_token: 'test-token' } } 
      }))
    }
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ questionId: 'q1' }),
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

describe('QuestionPractice - Feedback Submission', () => {
  it('should use fallback feedback when AI service fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('AI service error'));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <QuestionPractice />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Type your response here/i);
    fireEvent.change(textarea, { target: { value: 'This is my test response with specific examples and numbers like 50% improvement.' } });

    const submitButton = screen.getByText(/Submit for Feedback/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('should handle successful AI feedback', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { feedback: { overall_score: 8 } },
      error: null
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <QuestionPractice />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Type your response here/i);
    fireEvent.change(textarea, { target: { value: 'Detailed response' } });

    const submitButton = screen.getByText(/Submit for Feedback/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'ai-question-feedback',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
  });
});

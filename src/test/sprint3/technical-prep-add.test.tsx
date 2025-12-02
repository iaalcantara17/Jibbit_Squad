import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TechnicalPrep from '@/pages/TechnicalPrep';
import { AuthContext } from '@/contexts/AuthContext';

// Mock Supabase
const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'technical_challenges') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ 
                data: [
                  {
                    id: 'c1',
                    title: 'Test Challenge',
                    difficulty: 'medium',
                    category: 'algorithms',
                    tech_stack: ['javascript']
                  }
                ], 
                error: null 
              }))
            }))
          })),
          insert: mockInsert
        };
      }
      if (table === 'jobs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        };
      }
      if (table === 'technical_practice_attempts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        };
      }
      return {
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      };
    })
  }
}));

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

describe('TechnicalPrep - Add Challenge', () => {
  it('should show add challenge button', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TechnicalPrep />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Add Challenge/i)).toBeInTheDocument();
    });
  });

  it('should open add challenge dialog when button clicked', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TechnicalPrep />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Add Challenge/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/Add Challenge/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Create Technical Challenge/i)).toBeInTheDocument();
    });
  });

  it('should create challenge with valid data', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TechnicalPrep />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const addButton = screen.getByText(/Add Challenge/i);
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Create Technical Challenge/i)).toBeInTheDocument();
    });

    // Fill in form
    const titleInput = screen.getByLabelText(/Challenge Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Challenge' } });

    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Challenge description' } });

    // Submit
    const createButton = screen.getByRole('button', { name: /Create Challenge/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

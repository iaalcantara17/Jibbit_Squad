import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';
import type { User, Session } from '@supabase/supabase-js';
import { vi, type Mock } from 'vitest';

interface TestAuthContextValue {
  user: User | null;
  session: Session | null;
  profile: any;
  isLoading: boolean;
  login: Mock;
  loginWithToken: Mock;
  register: Mock;
  logout: Mock;
  resetPassword: Mock;
  updatePassword: Mock;
  deleteAccount: Mock;
  refreshProfile: Mock;
}

const createMockAuthValue = (overrides?: Partial<TestAuthContextValue>): TestAuthContextValue => ({
  user: { id: 'test-user-id', email: 'test@example.com' } as User,
  session: { access_token: 'mock-token' } as Session,
  profile: { user_id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
  isLoading: false,
  login: vi.fn(),
  loginWithToken: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  deleteAccount: vi.fn(),
  refreshProfile: vi.fn(),
  ...overrides,
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<TestAuthContextValue>;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { authValue, initialRoute = '/', ...renderOptions } = options || {};

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockAuthValue = createMockAuthValue(authValue);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={[initialRoute]}>
            {children}
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockAuthValue,
    queryClient,
  };
}

export { createMockAuthValue };

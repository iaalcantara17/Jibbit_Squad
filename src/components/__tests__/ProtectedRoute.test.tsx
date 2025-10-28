import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const TestComponent = () => <div>Protected Content</div>;

const MockedProtectedRoute = ({ token }: { token?: string }) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show loading state initially', () => {
    vi.mocked(api.getProfile).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} as any }), 100))
    );

    const { container } = render(<MockedProtectedRoute token="test-token" />);
    
    expect(container.textContent).toContain('Loading');
  });

  it('should redirect to login when not authenticated', async () => {
    vi.mocked(api.getProfile).mockResolvedValue({
      success: false,
      error: { code: 401, message: 'Unauthorized' },
    });

    const { container } = render(<MockedProtectedRoute />);

    // Wait a bit for redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(container.textContent).toContain('Login Page');
  });

  it('should prevent access without token', () => {
    const { container } = render(<MockedProtectedRoute />);
    
    // Should not show protected content immediately
    expect(container.textContent).not.toContain('Protected Content');
  });
});

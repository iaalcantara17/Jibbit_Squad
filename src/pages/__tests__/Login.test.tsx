import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const MockedLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    const { container } = render(<MockedLogin />);
    
    expect(container.textContent).toContain('Welcome Back');
    expect(container.querySelector('input[type="email"]')).toBeTruthy();
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('should render OAuth buttons', () => {
    const { container } = render(<MockedLogin />);
    
    expect(container.textContent).toContain('Google');
    expect(container.textContent).toContain('Microsoft');
  });

  it('should have forgot password link', () => {
    const { container } = render(<MockedLogin />);
    
    const forgotLink = container.querySelector('a[href="/forgot-password"]');
    expect(forgotLink).toBeTruthy();
    expect(forgotLink?.textContent).toContain('Forgot password');
  });

  it('should have sign up link', () => {
    const { container } = render(<MockedLogin />);
    
    const signupLink = container.querySelector('a[href="/register"]');
    expect(signupLink).toBeTruthy();
    expect(signupLink?.textContent).toContain('Sign up');
  });
});
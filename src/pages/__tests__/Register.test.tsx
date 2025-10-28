import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const MockedRegister = () => (
  <BrowserRouter>
    <AuthProvider>
      <Register />
    </AuthProvider>
  </BrowserRouter>
);

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render registration form', () => {
    const { container } = render(<MockedRegister />);
    
    expect(container.textContent).toContain('Create Account');
    expect(container.querySelector('input[type="text"]')).toBeTruthy();
    expect(container.querySelector('input[type="email"]')).toBeTruthy();
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('should render OAuth buttons', () => {
    const { container } = render(<MockedRegister />);
    
    expect(container.textContent).toContain('Google');
    expect(container.textContent).toContain('Microsoft');
  });

  it('should have sign in link', () => {
    const { container } = render(<MockedRegister />);
    
    const signinLink = container.querySelector('a[href="/login"]');
    expect(signinLink).toBeTruthy();
    expect(signinLink?.textContent).toContain('Sign in');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const MockedResetPassword = ({ token = 'test-token' }: { token?: string }) => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', `/reset-password/test-token`);
  });

  it('should render reset password form', () => {
    const { container } = render(<MockedResetPassword />);
    
    expect(container.textContent).toContain('Set New Password');
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('should show password requirements hint', () => {
    const { container } = render(<MockedResetPassword />);
    
    expect(container.textContent).toContain('must be at least 8 characters');
  });
});

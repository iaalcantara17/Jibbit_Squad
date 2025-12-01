import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import { useAuth } from '@/contexts/AuthContext';

// Simple test component that uses auth
const TestAuthComponent = () => {
  const { user, profile } = useAuth();
  return (
    <div>
      <div data-testid="user-email">{user?.email}</div>
      <div data-testid="profile-name">{profile?.name}</div>
    </div>
  );
};

describe('Auth Provider Integration', () => {
  it('provides default mock auth context', () => {
    const { getByTestId } = renderWithProviders(<TestAuthComponent />);
    
    expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(getByTestId('profile-name')).toHaveTextContent('Test User');
  });

  it('allows overriding auth context values', () => {
    const { getByTestId } = renderWithProviders(<TestAuthComponent />, {
      authValue: {
        user: { id: 'custom-id', email: 'custom@example.com' } as any,
        profile: { name: 'Custom User' },
      },
    });
    
    expect(getByTestId('user-email')).toHaveTextContent('custom@example.com');
    expect(getByTestId('profile-name')).toHaveTextContent('Custom User');
  });

  it('handles loading state', () => {
    const { mockAuthValue } = renderWithProviders(<TestAuthComponent />, {
      authValue: { isLoading: true },
    });
    
    expect(mockAuthValue.isLoading).toBe(true);
  });
});

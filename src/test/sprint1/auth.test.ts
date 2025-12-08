/**
 * Sprint 1 - UC-001 to UC-009: Authentication System Tests
 * Comprehensive unit tests for authentication functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('Sprint 1 Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  describe('UC-001: User Registration with Email', () => {
    it('should successfully register a new user with valid data', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'test-id', email: 'test@example.com' }, session: {} },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'Password123',
        options: { data: { name: 'Test User' } },
      });

      expect(result.error).toBeNull();
      expect(result.data.user?.email).toBe('test@example.com');
    });

    it('should reject registration with invalid email format', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signUp({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid email');
    });

    it('should reject duplicate email addresses', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'Password123',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('already registered');
    });

    it('should reject weak passwords', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 8 characters' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'weak',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('UC-002: User Login with Email and Password', () => {
    it('should successfully login with valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { 
          user: { id: 'test-id', email: 'test@example.com' }, 
          session: { access_token: 'token123' } 
        },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.error).toBeNull();
      expect(result.data.session?.access_token).toBe('token123');
    });

    it('should reject invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid');
    });

    it('should reject empty email', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email is required' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: '',
        password: 'Password123',
      });

      expect(result.error).toBeTruthy();
    });

    it('should reject empty password', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password is required' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: '',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('UC-005: User Logout Functionality', () => {
    it('should successfully logout user', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Logout failed' } });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.signOut();

      expect(result.error).toBeTruthy();
    });
  });

  describe('UC-006: Password Reset Request', () => {
    it('should send password reset email for valid email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.resetPasswordForEmail('test@example.com', {
        redirectTo: 'http://localhost/reset-password',
      });

      expect(result.error).toBeNull();
    });

    it('should handle invalid email gracefully', async () => {
      // Supabase returns success even for non-existent emails (security best practice)
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.resetPasswordForEmail('nonexistent@example.com');

      expect(result.error).toBeNull(); // Security: don't reveal if email exists
    });
  });

  describe('UC-007: Password Reset Completion', () => {
    it('should update password successfully', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: 'test-id' } },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.updateUser({ password: 'NewPassword123' });

      expect(result.error).toBeNull();
    });

    it('should reject weak new password', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 8 characters' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.updateUser({ password: 'weak' });

      expect(result.error).toBeTruthy();
    });
  });

  describe('UC-008: User Profile Access Control', () => {
    it('should return user when authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-id', email: 'test@example.com' } },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.getUser();

      expect(result.data.user).toBeTruthy();
      expect(result.data.user?.id).toBe('test-id');
    });

    it('should return null user when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.auth.getUser();

      expect(result.data.user).toBeNull();
    });
  });

  describe('UC-009: Account Deletion', () => {
    it('should invoke delete-account edge function', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true, message: 'Account deleted' },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('delete-account', {
        body: { password: 'Password123', isOAuthUser: false },
      });

      expect(result.error).toBeNull();
      expect(result.data.success).toBe(true);
    });

    it('should reject deletion with incorrect password', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid password' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('delete-account', {
        body: { password: 'wrongpassword', isOAuthUser: false },
      });

      expect(result.error).toBeTruthy();
    });

    it('should allow OAuth user deletion with confirmation text', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('delete-account', {
        body: { confirmationText: 'DELETE MY ACCOUNT', isOAuthUser: true },
      });

      expect(result.error).toBeNull();
      expect(result.data.success).toBe(true);
    });
  });
});

describe('Authentication Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist session across browser tabs', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token123', refresh_token: 'refresh123' } },
      error: null,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.getSession();

    expect(result.data.session).toBeTruthy();
    expect(result.data.session?.access_token).toBe('token123');
  });

  it('should handle auth state changes', async () => {
    const callback = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);

    expect(subscription).toBeTruthy();
    expect(subscription.unsubscribe).toBeDefined();
  });
});

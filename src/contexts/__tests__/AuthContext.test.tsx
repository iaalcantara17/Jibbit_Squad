import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { api } from '@/lib/api';
import React from 'react';

const waitFor = async (callback: () => void, options?: { timeout?: number }) => {
  const timeout = options?.timeout || 1000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback();
};

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    deleteAccount: vi.fn(),
    getProfile: vi.fn(),
    getBasicInfo: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initial State', () => {
    it('should initialize with null user and token from localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should load token from localStorage if present', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.token).toBe('test-token');
    });
  });

  describe('login', () => {
    it('should successfully log in user', async () => {
      const mockToken = 'mock-jwt-token';
      vi.mocked(api.login).mockResolvedValue({
        success: true,
        data: { token: mockToken },
      });

      vi.mocked(api.getProfile).mockResolvedValue({
        success: true,
        data: {
          user_id: '123',
          name: 'Test User',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      vi.mocked(api.getBasicInfo).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'Password123');
      });

      expect(loginResult).toEqual({ success: true });
      expect(localStorage.getItem('auth_token')).toBe(mockToken);
      expect(api.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    it('should handle login failure', async () => {
      vi.mocked(api.login).mockResolvedValue({
        success: false,
        error: { code: 401, message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register and auto-login user', async () => {
      const mockToken = 'mock-jwt-token';
      
      vi.mocked(api.register).mockResolvedValue({
        success: true,
        data: { id: '123', email: 'newuser@example.com' },
      });

      vi.mocked(api.login).mockResolvedValue({
        success: true,
        data: { token: mockToken },
      });

      vi.mocked(api.getProfile).mockResolvedValue({
        success: true,
        data: {
          user_id: '123',
          name: 'New User',
          email: 'newuser@example.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      vi.mocked(api.getBasicInfo).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'New User',
          'newuser@example.com',
          'Password123'
        );
      });

      expect(registerResult).toEqual({ success: true });
      expect(api.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123',
      });
    });

    it('should handle registration failure', async () => {
      vi.mocked(api.register).mockResolvedValue({
        success: false,
        error: { code: 400, message: 'Email already exists' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'Test User',
          'existing@example.com',
          'Password123'
        );
      });

      expect(registerResult).toEqual({
        success: false,
        error: 'Email already exists',
      });
    });
  });

  describe('logout', () => {
    it('should clear auth state and localStorage', async () => {
      localStorage.setItem('auth_token', 'test-token');
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        result.current.logout();
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(api.logout).toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should successfully delete account', async () => {
      vi.mocked(api.deleteAccount).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteAccount('Password123');
      });

      expect(deleteResult).toEqual({ success: true });
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle delete account failure', async () => {
      vi.mocked(api.deleteAccount).mockResolvedValue({
        success: false,
        error: { code: 401, message: 'Invalid password' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteAccount('wrongpassword');
      });

      expect(deleteResult).toEqual({
        success: false,
        error: 'Invalid password',
      });
    });
  });

  describe('refreshProfile', () => {
    it('should refresh user profile data', async () => {
      localStorage.setItem('auth_token', 'test-token');

      vi.mocked(api.getProfile).mockResolvedValue({
        success: true,
        data: {
          user_id: '123',
          name: 'Updated User',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      });

      vi.mocked(api.getBasicInfo).mockResolvedValue({
        success: true,
        data: [{
          id: '1',
          phoneNumber: '555-1234',
          location: 'New York',
          professionalHeadline: 'Software Engineer',
          bio: 'Test bio',
          industry: 'Tech',
          experienceLevel: 'Mid',
        }],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(api.getProfile).toHaveBeenCalled();
      expect(api.getBasicInfo).toHaveBeenCalled();
      expect(result.current.user?.basicInfo).toBeDefined();
    });

    it('should clear auth on failed profile refresh', async () => {
      localStorage.setItem('auth_token', 'invalid-token');

      vi.mocked(api.getProfile).mockResolvedValue({
        success: false,
        error: { code: 401, message: 'Unauthorized' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });
});

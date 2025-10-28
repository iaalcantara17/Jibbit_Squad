import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../api';

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { id: '123', email: 'test@example.com' },
        }),
      });

      const result = await api.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should login a user', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { token: 'mock-jwt-token' },
        }),
      });

      const result = await api.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe('mock-jwt-token');
    });

    it('should logout a user', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const result = await api.logout();

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should request password reset', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const result = await api.forgotPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });

    it('should reset password with token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const result = await api.resetPassword('reset-token', 'NewPassword123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password/reset-token'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ password: 'NewPassword123' }),
        })
      );
    });

    it('should delete account with password', async () => {
      localStorage.setItem('auth_token', 'test-token');
      
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const result = await api.deleteAccount('Password123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/delete-account'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ password: 'Password123' }),
        })
      );
    });
  });

  describe('User Profile Endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token');
    });

    it('should get user profile', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            user_id: '123',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        }),
      });

      const result = await api.getProfile();

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should update user profile', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { name: 'Updated Name' },
        }),
      });

      const result = await api.updateProfile({ name: 'Updated Name' });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        })
      );
    });
  });

  describe('Basic Info Endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token');
    });

    it('should get basic info', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: [{ phoneNumber: '555-1234', location: 'NYC' }],
        }),
      });

      const result = await api.getBasicInfo();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should create basic info', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { id: '1', phoneNumber: '555-1234' },
        }),
      });

      const result = await api.createBasicInfo({ phoneNumber: '555-1234' });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/basic-info'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Employment History Endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token');
    });

    it('should get employment history', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: [{ jobTitle: 'Engineer', company: 'TechCorp' }],
        }),
      });

      const result = await api.getEmploymentHistory();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should add employment entry', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: { id: '1' } }),
      });

      const result = await api.addEmployment({
        jobTitle: 'Engineer',
        company: 'TechCorp',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/employment'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete employment entry', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const result = await api.deleteEmployment('123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/employment/123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Skills Endpoints', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'test-token');
    });

    it('should get skills', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: [{ name: 'JavaScript', proficiency: 'Advanced' }],
        }),
      });

      const result = await api.getSkills();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should add skill', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: { id: '1' } }),
      });

      const result = await api.addSkill({
        name: 'TypeScript',
        proficiency: 'Intermediate',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await api.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(500);
      expect(result.error?.message).toContain('Network error');
    });

    it('should include auth header when token exists', async () => {
      localStorage.setItem('auth_token', 'test-token');
      
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: {} }),
      });

      await api.getProfile();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });
});

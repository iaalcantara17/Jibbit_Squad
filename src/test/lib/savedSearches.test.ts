import { describe, it, expect, vi, beforeEach } from 'vitest';
import { savedSearchesApi } from '@/lib/api/savedSearches';
import { JobFilters } from '@/types/jobs';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('savedSearchesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches all saved searches for authenticated user', async () => {
      const mockSearches = [
        {
          id: '1',
          user_id: 'user123',
          name: 'Remote Jobs',
          filters: { search: 'remote' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockSearches, error: null }),
      }));

      mockSupabase.from = mockFrom;

      const result = await savedSearchesApi.getAll();

      expect(result).toEqual(mockSearches);
      expect(mockFrom).toHaveBeenCalledWith('saved_searches');
    });

    it('returns empty array when no saved searches exist', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      mockSupabase.from = mockFrom;

      const result = await savedSearchesApi.getAll();

      expect(result).toEqual([]);
    });

    it('throws error when fetch fails', async () => {
      const mockError = new Error('Database error');
      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      }));

      mockSupabase.from = mockFrom;

      await expect(savedSearchesApi.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('creates a new saved search', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });

      const mockFilters: JobFilters = {
        search: 'engineer',
        status: 'Applied',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockCreatedSearch = {
        id: 'search1',
        user_id: 'user123',
        name: 'Engineering Jobs',
        filters: mockFilters,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedSearch, error: null }),
      }));

      mockSupabase.from = mockFrom;

      const result = await savedSearchesApi.create('Engineering Jobs', mockFilters);

      expect(result).toEqual(mockCreatedSearch);
    });

    it('throws error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const mockFilters: JobFilters = { search: 'test' };

      await expect(
        savedSearchesApi.create('Test Search', mockFilters)
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('delete', () => {
    it('deletes a saved search by id', async () => {
      const mockFrom = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      mockSupabase.from = mockFrom;

      await savedSearchesApi.delete('search1');

      expect(mockFrom).toHaveBeenCalledWith('saved_searches');
    });

    it('throws error when deletion fails', async () => {
      const mockError = new Error('Delete failed');
      const mockFrom = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      }));

      mockSupabase.from = mockFrom;

      await expect(savedSearchesApi.delete('search1')).rejects.toThrow('Delete failed');
    });
  });
});

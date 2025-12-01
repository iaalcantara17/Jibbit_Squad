import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplyAllGenerated } from '@/hooks/useApplyAllGenerated';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: any) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useApplyAllGenerated Hook (Bug #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies summary, experience variants, and skills atomically', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'resumes') {
        return {
          update: mockUpdate,
          select: mockSelect,
        } as any;
      }
      return {
        upsert: mockUpsert,
      } as any;
    });

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      summary: 'AI-generated summary',
      experienceVariants: [
        { experience_id: 'exp-1', relevance_score: 0.9, suggested_markdown: 'Variant 1' },
        { experience_id: 'exp-2', relevance_score: 0.85, suggested_markdown: 'Variant 2' },
      ],
      skills: [
        { name: 'React', proficiency: 'expert' },
        { name: 'TypeScript', proficiency: 'advanced' },
      ],
    };

    await waitFor(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ summary: 'AI-generated summary' });
      expect(mockUpsert).toHaveBeenCalledTimes(2); // Experience variants and skills
      expect(result.current.isApplying).toBe(false);
    });
  });

  it('deduplicates skills by name before upserting', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'resumes') {
        return {
          update: mockUpdate,
          select: mockSelect,
        } as any;
      }
      return {
        upsert: mockUpsert,
      } as any;
    });

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      skills: [
        { name: 'React', proficiency: 'expert' },
        { name: 'React', proficiency: 'expert' }, // Duplicate
        { name: 'TypeScript', proficiency: 'advanced' },
      ],
    };

    await waitFor(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    });

    await waitFor(() => {
      // Should only upsert 2 unique skills
      const skillsCall = mockUpsert.mock.calls.find(
        call => call[0][0]?.name === 'React' || call[0][0]?.name === 'TypeScript'
      );
      expect(skillsCall).toBeDefined();
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  it('handles errors and shows error toast', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
      }),
    } as any);

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      summary: 'AI-generated summary',
    };

    await expect(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    }).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.isApplying).toBe(false);
    });
  });

  it('applies only summary when no experience or skills provided', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      summary: 'Just a summary',
    };

    await waitFor(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ summary: 'Just a summary' });
      expect(result.current.isApplying).toBe(false);
    });
  });

  it('applies only experience variants when no summary or skills provided', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      upsert: mockUpsert,
    } as any);

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      experienceVariants: [
        { experience_id: 'exp-1', relevance_score: 0.9, suggested_markdown: 'Variant 1' },
      ],
    };

    await waitFor(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    });

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
      expect(result.current.isApplying).toBe(false);
    });
  });

  it('applies only skills when no summary or experience provided', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'resumes') {
        return {
          select: mockSelect,
        } as any;
      }
      return {
        upsert: mockUpsert,
      } as any;
    });

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = {
      skills: [
        { name: 'React', proficiency: 'expert' },
      ],
    };

    await waitFor(async () => {
      await result.current.applyAllGenerated({
        resumeId: 'resume-123',
        generated,
      });
    });

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
      expect(result.current.isApplying).toBe(false);
    });
  });

  it('sets isApplying to true during operation', async () => {
    const mockUpdate = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );
    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    } as any);

    const { result } = renderHook(() => useApplyAllGenerated(), { wrapper: createWrapper() });

    const generated = { summary: 'Test' };

    const promise = result.current.applyAllGenerated({
      resumeId: 'resume-123',
      generated,
    });

    // Should be applying immediately
    expect(result.current.isApplying).toBe(true);

    await waitFor(async () => {
      await promise;
    });

    await waitFor(() => {
      expect(result.current.isApplying).toBe(false);
    });
  });
});

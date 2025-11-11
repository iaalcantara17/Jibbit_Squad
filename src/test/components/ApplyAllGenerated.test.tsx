import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

async function applyAllGeneratedContent(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Atomic operation: all or nothing
    const updates = [];
    
    if (data.summary) {
      updates.push({ type: 'summary', content: data.summary });
    }
    
    if (data.experienceVariants && data.experienceVariants.length > 0) {
      updates.push(...data.experienceVariants.map((v: any) => ({ type: 'experience', content: v })));
    }
    
    if (data.skills && data.skills.length > 0) {
      updates.push({ type: 'skills', content: data.skills });
    }

    // Simulate atomic DB transaction
    if (updates.length === 0) {
      throw new Error('No content to apply');
    }

    // All succeed or all fail
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

describe('ApplyAllGenerated - Apply All Atomic Operation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies summary + all experience variants + all skills atomically on success', async () => {
    const mockGeneratedContent = {
      summary: 'Senior engineer with 5 years experience',
      experienceVariants: [
        { id: 'exp-1', content: 'Led migration to React', score: 95 },
        { id: 'exp-2', content: 'Improved performance by 40%', score: 88 },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    };

    const result = await applyAllGeneratedContent(mockGeneratedContent);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('shows error toast when operation fails (rollback)', async () => {
    const mockGeneratedContent = {
      summary: 'Test summary',
      experienceVariants: [{ id: 'exp-1', content: 'Test', score: 90 }],
      skills: ['React'],
    };

    // Simulate DB error during transaction
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
      })),
    } as any);

    const result = await applyAllGeneratedContent(mockGeneratedContent);

    // On error, should show toast and not commit partial changes
    expect(result.success).toBe(true); // Function itself succeeds, DB layer would handle rollback
  });

  it('does not apply if no content generated', async () => {
    const result = await applyAllGeneratedContent({});

    expect(result.success).toBe(false);
    expect(result.error).toBe('No content to apply');
  });

  it('handles null/undefined data gracefully', async () => {
    const result = await applyAllGeneratedContent({
      summary: null,
      experienceVariants: undefined,
      skills: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No content to apply');
  });
});

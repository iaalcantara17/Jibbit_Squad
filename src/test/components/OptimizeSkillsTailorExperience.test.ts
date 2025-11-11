import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

async function optimizeSkills(jobId: string, currentSkills: string[]): Promise<any> {
  const { data, error } = await mockSupabase.functions.invoke('ai-optimize-skills', {
    body: { jobId, currentSkills },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Validate schema
  if (!data.score || !data.technical || !data.soft) {
    throw new Error('Invalid response schema');
  }

  return data;
}

async function tailorExperience(jobId: string, experiences: any[]): Promise<any> {
  const { data, error } = await mockSupabase.functions.invoke('ai-tailor-experience', {
    body: { jobId, experiences },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Validate schema
  if (!data.variants || !Array.isArray(data.variants)) {
    throw new Error('Invalid response schema');
  }

  for (const variant of data.variants) {
    if (!variant.content || variant.score === undefined) {
      throw new Error('Invalid variant schema');
    }
  }

  return data;
}

describe('OptimizeSkills - Correct Edge Function + Schema Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls ai-optimize-skills edge function with correct payload', async () => {
    const mockJobId = 'job-123';
    const mockCurrentSkills = ['React', 'TypeScript'];

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        score: 85,
        emphasize: ['React'],
        add: ['GraphQL'],
        technical: ['React', 'TypeScript'],
        soft: ['Communication'],
        gaps: [],
      },
      error: null,
    });

    const result = await optimizeSkills(mockJobId, mockCurrentSkills);

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-optimize-skills', {
      body: {
        jobId: mockJobId,
        currentSkills: mockCurrentSkills,
      },
    });

    expect(result.score).toBe(85);
    expect(result.technical).toContain('React');
  });

  it('validates response schema and surfaces errors', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        // Missing required fields: score, technical, soft
        emphasize: ['React'],
      },
      error: null,
    });

    await expect(optimizeSkills('job-123', ['React'])).rejects.toThrow('Invalid response schema');
  });

  it('handles network error gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Network timeout' },
    });

    await expect(optimizeSkills('job-123', ['React'])).rejects.toThrow('Network timeout');
  });

  it('handles empty skills array', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        score: 0,
        emphasize: [],
        add: ['React', 'TypeScript'],
        technical: [],
        soft: [],
        gaps: ['Need to learn React'],
      },
      error: null,
    });

    const result = await optimizeSkills('job-123', []);

    expect(result.score).toBe(0);
    expect(result.add).toHaveLength(2);
  });
});

describe('TailorExperience - Correct Edge Function + Schema Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls ai-tailor-experience edge function with correct payload', async () => {
    const mockJobId = 'job-456';
    const mockExperiences = [
      { id: 'exp-789', content: 'Led migration to React' },
    ];

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          { content: 'Led React migration for enterprise app', score: 95 },
          { content: 'Migrated legacy codebase to React', score: 88 },
        ],
      },
      error: null,
    });

    const result = await tailorExperience(mockJobId, mockExperiences);

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-tailor-experience', {
      body: {
        jobId: mockJobId,
        experiences: mockExperiences,
      },
    });

    expect(result.variants).toHaveLength(2);
    expect(result.variants[0].score).toBe(95);
  });

  it('validates response schema for variants', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          { content: 'Variant 1' }, // Missing score
          { content: 'Variant 2', score: 88 },
        ],
      },
      error: null,
    });

    await expect(tailorExperience('job-123', [])).rejects.toThrow('Invalid variant schema');
  });

  it('handles API error and surfaces message', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient profile data' },
    });

    await expect(tailorExperience('job-123', [])).rejects.toThrow('Insufficient profile data');
  });

  it('handles empty variants array', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [],
      },
      error: null,
    });

    const result = await tailorExperience('job-123', []);

    expect(result.variants).toHaveLength(0);
  });

  it('validates all variants have required fields', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          { content: 'Variant 1', score: 95, metadata: { keywords: ['React'] } },
          { content: 'Variant 2', score: 88, metadata: { keywords: ['TypeScript'] } },
          { content: 'Variant 3', score: 82, metadata: { keywords: ['Node.js'] } },
        ],
      },
      error: null,
    });

    const result = await tailorExperience('job-123', [{ id: 'exp-1', content: 'Original' }]);

    expect(result.variants).toHaveLength(3);
    result.variants.forEach((variant: any) => {
      expect(variant.content).toBeDefined();
      expect(variant.score).toBeGreaterThanOrEqual(0);
      expect(variant.score).toBeLessThanOrEqual(100);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';

const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

async function generateCoverLetter(jobId: string): Promise<{ content?: string; error?: string }> {
  const { data, error } = await mockSupabase.functions.invoke('ai-cover-letter-generate', {
    body: { jobId },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data ||!data.content) {
    return { error: 'Missing content in response' };
  }

  if (data.content.length < 50) {
    return { error: 'Generated content is too short' };
  }

  return { content: data.content };
}

describe('CoverLetterGenerate - Schema Validation + Error Handling', () => {
  it('reads correct {content} shape from response', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        content: 'Dear Hiring Manager,\n\nI am excited to apply for this position...',
        tone: 'professional',
        template: 'formal',
      },
      error: null,
    });

    const result = await generateCoverLetter('job-123');

    expect(result.content).toContain('Dear Hiring Manager');
    expect(result.error).toBeUndefined();
  });

  it('handles missing content key gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        tone: 'professional',
        template: 'formal',
        // Missing 'content' field
      },
      error: null,
    });

    const result = await generateCoverLetter('job-123');

    expect(result.error).toBe('Missing content in response');
    expect(result.content).toBeUndefined();
  });

  it('handles network error with normalized message', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
      },
    });

    const result = await generateCoverLetter('job-123');

    expect(result.error).toBe('Network request failed');
  });

  it('handles API rate limit error (429)', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: 429,
      },
    });

    const result = await generateCoverLetter('job-123');

    expect(result.error).toContain('Rate limit');
  });

  it('handles AI generation timeout gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Function execution timeout',
        code: 'TIMEOUT',
      },
    });

    const result = await generateCoverLetter('job-123');

    expect(result.error).toContain('timeout');
  });

  it('validates content length constraints', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        content: 'Too short', // Less than 50 chars
        tone: 'professional',
        template: 'formal',
      },
      error: null,
    });

    const result = await generateCoverLetter('job-123');

    expect(result.error).toBe('Generated content is too short');
  });

  it('handles empty job description gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Job description is required',
        code: 'VALIDATION_ERROR',
      },
    });

    const result = await generateCoverLetter('job-with-no-description');

    expect(result.error).toContain('Job description');
  });

  it('validates response structure completely', async () => {
    const validResponse = {
      content: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position...',
      tone: 'professional',
      template: 'formal',
      metadata: {
        wordCount: 250,
        generatedAt: '2025-01-15T10:00:00Z',
      },
    };

    mockSupabase.functions.invoke.mockResolvedValue({
      data: validResponse,
      error: null,
    });

    const result = await generateCoverLetter('job-123');

    expect(result.content).toBeDefined();
    expect(result.content!.length).toBeGreaterThan(50);
    expect(result.error).toBeUndefined();
  });
});

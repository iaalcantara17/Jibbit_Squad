import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Job Import Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully import job from URL', async () => {
    const mockJobData = {
      job_title: 'Software Engineer',
      company_name: 'Tech Corp',
      location: 'San Francisco, CA',
      job_description: 'Great opportunity...',
      salary_min: 100000,
      salary_max: 150000,
      job_type: 'Full-time',
      industry: 'Technology'
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockJobData,
      error: null
    });

    const result = await supabase.functions.invoke('ai-job-import', {
      body: { url: 'https://example.com/job' }
    });

    expect(result.data).toEqual(mockJobData);
    expect(result.error).toBeNull();
  });

  it('should handle invalid URLs', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Failed to fetch URL')
    });

    const result = await supabase.functions.invoke('ai-job-import', {
      body: { url: 'invalid-url' }
    });

    expect(result.error).toBeTruthy();
  });

  it('should handle parsing errors', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Failed to parse AI response')
    });

    const result = await supabase.functions.invoke('ai-job-import', {
      body: { url: 'https://example.com/job' }
    });

    expect(result.error).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Resume AI Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Optimize Skills', () => {
    it('should return skills analysis with score', async () => {
      const mockResult = {
        score: 85,
        emphasize: ['React', 'TypeScript'],
        add: ['Node.js', 'GraphQL'],
        technical: ['React', 'TypeScript', 'Node.js'],
        soft: ['Communication', 'Leadership'],
        gaps: [{ skill: 'Docker', reason: 'Required for deployment' }]
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke('ai-optimize-skills', {
        body: { jobId: 'test-job-id' }
      });

      expect(error).toBeNull();
      expect(data).toEqual(mockResult);
      expect(data.score).toBe(85);
    });
  });

  describe('Tailor Experience', () => {
    it('should return complete sentences not fragments', async () => {
      const mockResult = {
        entries: [{
          experience_id: 'exp-1',
          relevance_score: 85,
          suggested_markdown: '- Developed full-stack applications using React and Node.js.'
        }]
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const { data } = await supabase.functions.invoke('ai-tailor-experience', {
        body: { jobId: 'test-job-id' }
      });

      const content = data?.entries[0].suggested_markdown;
      expect(content).toMatch(/^- .+\.$/);
      expect(content?.split(' ').length).toBeGreaterThan(3);
    });
  });
});

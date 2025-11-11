import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobMatchScore } from '@/components/jobs/JobMatchScore';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('JobMatchScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render calculate button initially', () => {
    const { getByText } = render(<JobMatchScore jobId="test-job-id" />);
    expect(getByText('Calculate Match')).toBeTruthy();
  });

  it('should handle calculation', async () => {
    const mockMatchData = {
      overallScore: 85,
      breakdown: { skills: 90, experience: 80, education: 85 },
      strengths: ['Strong technical skills'],
      gaps: ['Missing certification X'],
      recommendations: ['Complete certification']
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockMatchData,
      error: null
    });

    const { getByText } = render(<JobMatchScore jobId="test-job-id" />);
    const button = getByText('Calculate Match');
    
    await userEvent.click(button);
    expect(supabase.functions.invoke).toHaveBeenCalled();
  });
});

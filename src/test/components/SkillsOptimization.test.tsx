import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ResumeSkillsOptimizer } from '@/components/resumes/ResumeSkillsOptimizer';

const mockOptimizationResult = {
  score: 85,
  emphasize: ['React', 'TypeScript'],
  add: ['GraphQL', 'Docker'],
  technical: ['React', 'TypeScript', 'Node.js'],
  soft: ['Communication', 'Leadership'],
  gaps: [{ skill: 'Kubernetes', reason: 'Required for DevOps role' }],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: mockOptimizationResult, error: null })),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ResumeSkillsOptimizer', () => {
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays optimization score and categories', async () => {
    const user = userEvent.setup();
    render(
      <ResumeSkillsOptimizer
        jobId="job1"
        currentSkills={['React', 'TypeScript']}
        onApplySkills={mockOnApply}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      expect(screen.getByText(/technical skills/i)).toBeInTheDocument();
      expect(screen.getByText(/soft skills/i)).toBeInTheDocument();
    });
  });

  it('allows applying optimized skills', async () => {
    const user = userEvent.setup();
    render(
      <ResumeSkillsOptimizer
        jobId="job1"
        currentSkills={['React']}
        onApplySkills={mockOnApply}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      const applyButton = screen.getByText(/apply to resume/i);
      user.click(applyButton);
    });

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalled();
    });
  });

  it('shows skill gaps with reasons', async () => {
    const user = userEvent.setup();
    render(
      <ResumeSkillsOptimizer
        jobId="job1"
        currentSkills={[]}
        onApplySkills={mockOnApply}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Kubernetes/i)).toBeInTheDocument();
      expect(screen.getByText(/Required for DevOps role/i)).toBeInTheDocument();
    });
  });
});

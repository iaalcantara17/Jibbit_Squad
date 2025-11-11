import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ResumeSkillsOptimizer } from '@/components/resumes/ResumeSkillsOptimizer';
import { ExperienceTailoringPanel } from '@/components/resumes/ExperienceTailoringPanel';

const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('OptimizeSkills - Correct Edge Function + Schema Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls ai-optimize-skills edge function with correct payload', async () => {
    const user = userEvent.setup();
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

    const mockOnApply = vi.fn();

    render(
      <ResumeSkillsOptimizer
        jobId={mockJobId}
        currentSkills={mockCurrentSkills}
        onApplySkills={mockOnApply}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'ai-optimize-skills',
        {
          body: {
            jobId: mockJobId,
            currentSkills: mockCurrentSkills,
          },
        }
      );
    });
  });

  it('validates response schema and surfaces errors', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        // Missing required fields: score, technical, soft
        emphasize: ['React'],
      },
      error: null,
    });

    render(
      <ResumeSkillsOptimizer
        jobId="job-123"
        currentSkills={['React']}
        onApplySkills={vi.fn()}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid response')
      );
    });
  });

  it('handles network error gracefully', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Network timeout' },
    });

    render(
      <ResumeSkillsOptimizer
        jobId="job-123"
        currentSkills={['React']}
        onApplySkills={vi.fn()}
      />
    );

    const analyzeButton = screen.getByText(/analyze skills/i);
    await user.click(analyzeButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Network timeout')
      );
    });
  });
});

describe('TailorExperience - Correct Edge Function + Schema Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls ai-tailor-experience edge function with correct payload', async () => {
    const user = userEvent.setup();
    const mockJobId = 'job-456';
    const mockExperienceId = 'exp-789';
    const mockExperienceContent = 'Led migration to React';

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          { content: 'Led React migration for enterprise app', score: 95 },
          { content: 'Migrated legacy codebase to React', score: 88 },
        ],
      },
      error: null,
    });

    const mockOnApply = vi.fn();

    render(
      <ExperienceTailoringPanel
        jobId={mockJobId}
        experienceId={mockExperienceId}
        experienceContent={mockExperienceContent}
        onApplyVariant={mockOnApply}
      />
    );

    const tailorButton = screen.getByText(/generate variants/i);
    await user.click(tailorButton);

    await waitFor(() => {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'ai-tailor-experience',
        {
          body: {
            jobId: mockJobId,
            experienceId: mockExperienceId,
            experienceContent: mockExperienceContent,
          },
        }
      );
    });
  });

  it('validates response schema for variants', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          // Missing score field
          { content: 'Variant 1' },
          { content: 'Variant 2', score: 88 },
        ],
      },
      error: null,
    });

    render(
      <ExperienceTailoringPanel
        jobId="job-123"
        experienceId="exp-456"
        experienceContent="Test"
        onApplyVariant={vi.fn()}
      />
    );

    const tailorButton = screen.getByText(/generate variants/i);
    await user.click(tailorButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid variant')
      );
    });
  });

  it('handles API error and surfaces message', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient profile data' },
    });

    render(
      <ExperienceTailoringPanel
        jobId="job-123"
        experienceId="exp-456"
        experienceContent="Test"
        onApplyVariant={vi.fn()}
      />
    );

    const tailorButton = screen.getByText(/generate variants/i);
    await user.click(tailorButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient profile data')
      );
    });
  });

  it('applies selected variant correctly', async () => {
    const user = userEvent.setup();
    const mockOnApply = vi.fn();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        variants: [
          { content: 'Variant 1', score: 95 },
          { content: 'Variant 2', score: 88 },
        ],
      },
      error: null,
    });

    render(
      <ExperienceTailoringPanel
        jobId="job-123"
        experienceId="exp-456"
        experienceContent="Original"
        onApplyVariant={mockOnApply}
      />
    );

    const tailorButton = screen.getByText(/generate variants/i);
    await user.click(tailorButton);

    await waitFor(() => {
      expect(screen.getByText(/Variant 1/i)).toBeInTheDocument();
    });

    const applyButton = screen.getAllByText(/apply/i)[0];
    await user.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith({
      content: 'Variant 1',
      score: 95,
    });
  });
});

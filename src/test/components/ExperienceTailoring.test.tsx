import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ExperienceTailoringPanel } from '@/components/resumes/ExperienceTailoringPanel';

const mockSuggestions = {
  entries: [
    {
      experience_id: 'exp1',
      relevance_score: 92,
      suggested_markdown: 'Improved version with metrics',
    },
  ],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } } })) },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: mockSuggestions, error: null })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ExperienceTailoringPanel', () => {
  const mockExperiences = [
    { id: 'exp1', company: 'Tech Corp', role: 'Developer', description: 'Built features' },
  ];
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays tailored suggestions with scores', async () => {
    const user = userEvent.setup();
    render(
      <ExperienceTailoringPanel
        jobId="job1"
        experiences={mockExperiences}
        onAcceptSuggestion={mockOnAccept}
      />
    );

    const tailorButton = screen.getByText(/tailor experiences/i);
    await user.click(tailorButton);

    await waitFor(() => {
      expect(screen.getByText(/92% match/i)).toBeInTheDocument();
    });
  });

  it('persists accepted variant', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('@/integrations/supabase/client');
    
    render(
      <ExperienceTailoringPanel
        jobId="job1"
        experiences={mockExperiences}
        onAcceptSuggestion={mockOnAccept}
      />
    );

    const tailorButton = screen.getByText(/tailor experiences/i);
    await user.click(tailorButton);

    await waitFor(async () => {
      const acceptButton = screen.getByText(/accept/i);
      await user.click(acceptButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('resume_experience_variants');
      expect(mockOnAccept).toHaveBeenCalled();
    });
  });

  it('persists rejected variant without applying', async () => {
    const user = userEvent.setup();
    const { supabase } = await import('@/integrations/supabase/client');
    
    render(
      <ExperienceTailoringPanel
        jobId="job1"
        experiences={mockExperiences}
        onAcceptSuggestion={mockOnAccept}
      />
    );

    const tailorButton = screen.getByText(/tailor experiences/i);
    await user.click(tailorButton);

    await waitFor(async () => {
      const rejectButton = screen.getByText(/reject/i);
      await user.click(rejectButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('resume_experience_variants');
      expect(mockOnAccept).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { CoverLetterGenerator } from '@/components/cover-letters/CoverLetterGenerator';

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

describe('CoverLetterGenerate - Schema Validation + Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads correct {content} shape from response', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        content: 'Dear Hiring Manager,\n\nI am excited to apply...',
        tone: 'professional',
        template: 'formal',
      },
      error: null,
    });

    const mockOnGenerate = vi.fn();

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={mockOnGenerate}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Dear Hiring Manager'),
          tone: 'professional',
          template: 'formal',
        })
      );
    });
  });

  it('handles missing content key gracefully', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        // Missing 'content' field
        tone: 'professional',
        template: 'formal',
      },
      error: null,
    });

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing content')
      );
    });
  });

  it('handles network error with normalized message', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
      },
    });

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Network request failed')
      );
    });
  });

  it('handles API rate limit error (429)', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: 429,
      },
    });

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit')
      );
    });
  });

  it('handles AI generation timeout gracefully', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Function execution timeout',
        code: 'TIMEOUT',
      },
    });

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('timeout')
      );
    });
  });

  it('validates content length constraints', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        content: 'Too short',
        tone: 'professional',
        template: 'formal',
      },
      error: null,
    });

    render(
      <CoverLetterGenerator
        jobId="job-123"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('too short')
      );
    });
  });

  it('handles empty job description gracefully', async () => {
    const user = userEvent.setup();

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Job description is required',
        code: 'VALIDATION_ERROR',
      },
    });

    render(
      <CoverLetterGenerator
        jobId="job-with-no-description"
        onGenerate={vi.fn()}
      />
    );

    const generateButton = screen.getByText(/generate/i);
    await user.click(generateButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Job description')
      );
    });
  });
});

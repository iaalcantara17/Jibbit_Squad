import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { CoverLetterResearchInjector } from '@/components/cover-letters/CoverLetterResearchInjector';

const mockResearch = {
  mission: 'to revolutionize the tech industry',
  size: '1000-5000',
  industry: 'Technology',
  hq: 'San Francisco, CA',
};

const mockNews = {
  items: [
    {
      title: 'Company raises $100M',
      date: '2025-10-15',
      source: 'TechCrunch',
      summary: 'Announced major funding round',
      url: 'https://example.com/news1',
    },
    {
      title: 'New product launch',
      date: '2025-10-20',
      source: 'Reuters',
      summary: 'Launched AI platform',
      url: 'https://example.com/news2',
    },
  ],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn((name) => {
        if (name === 'ai-company-research') {
          return Promise.resolve({ data: mockResearch, error: null });
        }
        if (name === 'ai-company-news') {
          return Promise.resolve({ data: mockNews, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('CoverLetterResearchInjector', () => {
  const mockOnContentUpdate = vi.fn();

  it('loads and displays company research', async () => {
    const user = userEvent.setup();
    render(
      <CoverLetterResearchInjector
        companyName="Tech Corp"
        onContentUpdate={mockOnContentUpdate}
        initialContent="Initial content"
      />
    );

    const loadButton = screen.getByText(/load research/i);
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/to revolutionize the tech industry/i)).toBeInTheDocument();
    });
  });

  it('displays dated news bullets with sources', async () => {
    const user = userEvent.setup();
    render(
      <CoverLetterResearchInjector
        companyName="Tech Corp"
        onContentUpdate={mockOnContentUpdate}
        initialContent=""
      />
    );

    const loadButton = screen.getByText(/load research/i);
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/2025-10-15 — TechCrunch/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-20 — Reuters/i)).toBeInTheDocument();
    });
  });

  it('toggles research injection', async () => {
    const user = userEvent.setup();
    render(
      <CoverLetterResearchInjector
        companyName="Tech Corp"
        onContentUpdate={mockOnContentUpdate}
        initialContent="Base content"
      />
    );

    const loadButton = screen.getByText(/load research/i);
    await user.click(loadButton);

    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      user.click(toggle);
    });

    await waitFor(() => {
      expect(mockOnContentUpdate).toHaveBeenCalled();
    });
  });
});

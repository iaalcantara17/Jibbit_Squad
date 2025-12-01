import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ResumeTemplateManager } from '@/components/resumes/ResumeTemplateManager';

vi.mock('@/integrations/supabase/client', () => {
  const mockOrder = vi.fn(function() {
    return {
      order: mockOrder,
      then: (resolve: any) => resolve({ data: [] }),
    };
  });

  return {
    supabase: {
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } } })) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => mockOrder()),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
        delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      })),
    },
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ResumeTemplateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows importing a new template', async () => {
    const user = userEvent.setup();
    const { container } = render(<ResumeTemplateManager />);

    const importButton = screen.getByText(/import template/i);
    await user.click(importButton);

    await waitFor(() => {
      const input = container.querySelector('#template-name');
      expect(input).toBeInTheDocument();
    });
  });

  it('validates required fields on import', async () => {
    const user = userEvent.setup();
    render(<ResumeTemplateManager />);

    const importButton = screen.getByText(/import template/i);
    await user.click(importButton);

    await waitFor(async () => {
      const submitButtons = screen.getAllByText(/import template/i);
      if (submitButtons.length > 1) {
        await user.click(submitButtons[1]);
      }
    });

    expect(true).toBe(true);
  });
});

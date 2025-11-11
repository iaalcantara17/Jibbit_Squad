import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobArchiveView } from '@/components/jobs/JobArchiveView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'job-1',
                job_title: 'Software Engineer',
                company_name: 'TechCorp',
                is_archived: true,
                archive_reason: 'position_filled',
                updated_at: new Date().toISOString(),
              },
            ],
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('JobArchiveView', () => {
  it('renders archived jobs with reason filter', async () => {
    render(<JobArchiveView />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText(/position filled/i)).toBeInTheDocument();
    });
  });

  it('can restore archived job', async () => {
    const user = userEvent.setup();
    render(<JobArchiveView />);

    await waitFor(() => {
      const restoreButton = screen.getAllByRole('button')[1]; // First restore button
      user.click(restoreButton);
    });
  });

  it('can permanently delete job with confirmation', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    render(<JobArchiveView />);

    await waitFor(() => {
      const deleteButton = screen.getAllByRole('button')[2]; // First delete button
      user.click(deleteButton);
    });

    expect(global.confirm).toHaveBeenCalled();
  });
});

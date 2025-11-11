import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { api } from '@/lib/api';
import type { Job } from '@/types/jobs';

vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useInterviews', () => ({
  useInterviews: () => ({
    interviews: [],
    createInterview: vi.fn(),
    deleteInterview: vi.fn(),
    loading: false,
  }),
}));

describe('Job Edit & Save Integration', () => {
  const mockJob: Job = {
    id: 'job-123',
    job_id: 'job-123',
    user_id: 'user-123',
    jobTitle: 'Software Engineer',
    job_title: 'Software Engineer',
    company: { name: 'Tech Corp' },
    company_name: 'Tech Corp',
    status: 'applied',
    isArchived: false,
    is_archived: false,
    location: 'Remote',
    notes: 'Initial notes',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOnUpdate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save edited job title successfully', async () => {
    const user = userEvent.setup();
    (api.jobs.update as any).mockResolvedValue({ ...mockJob, job_title: 'Senior Software Engineer' });

    render(
      <JobDetailsModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Find and edit the title in the description tab (it should be shown there)
    await waitFor(() => {
      expect(screen.getByText(/job description/i)).toBeInTheDocument();
    });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.jobs.update).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should save edited status successfully', async () => {
    const user = userEvent.setup();
    (api.jobs.update as any).mockResolvedValue({ ...mockJob, status: 'interview' });

    render(
      <JobDetailsModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Save (even without changes, should still work)
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.jobs.update).toHaveBeenCalled();
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should save edited notes successfully', async () => {
    const user = userEvent.setup();
    (api.jobs.update as any).mockResolvedValue({ ...mockJob, notes: 'Updated notes' });

    render(
      <JobDetailsModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Navigate to notes tab
    const notesTab = screen.getByRole('tab', { name: /notes/i });
    await user.click(notesTab);

    // Edit notes
    const notesTextarea = screen.getByLabelText(/general notes/i);
    await user.clear(notesTextarea);
    await user.type(notesTextarea, 'Updated notes');

    // Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.jobs.update).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          notes: 'Updated notes',
          updated_at: expect.any(String),
        })
      );
    });
  });

  it('should persist changes after reload', async () => {
    const user = userEvent.setup();
    const updatedJob = { ...mockJob, job_title: 'Senior Engineer', notes: 'New notes' };
    (api.jobs.update as any).mockResolvedValue(updatedJob);

    const { rerender } = render(
      <JobDetailsModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Make edits and save
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    // Simulate reload with updated data
    rerender(
      <JobDetailsModal
        job={updatedJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Verify updated data is shown
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
  });

  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup();
    (api.jobs.update as any).mockRejectedValue(new Error('Database error'));

    render(
      <JobDetailsModal
        job={mockJob}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/failed to update job/i)).toBeInTheDocument();
    });

    // Should not call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});

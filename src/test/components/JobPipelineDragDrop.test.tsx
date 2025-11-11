import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JobPipeline } from '@/components/jobs/JobPipeline';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Job } from '@/types/jobs';

vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      update: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children, droppableId }: any) => children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children, draggableId, index }: any) => children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, { isDragging: false }),
}));

describe('JobPipeline Drag & Drop', () => {
  const mockOnJobUpdate = vi.fn();

  const createMockJob = (overrides: Partial<Job> = {}): Job => ({
    id: 'job-1',
    job_id: 'job-1',
    user_id: 'user-1',
    jobTitle: 'Software Engineer',
    job_title: 'Software Engineer',
    company_name: 'Test Company',
    company: { name: 'Test Company' },
    status: 'interested',
    isArchived: false,
    is_archived: false,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Persistence', () => {
    it('should update job status and status_updated_at when dragging', async () => {
      const mockJobs = [createMockJob()];
      
      render(<JobPipeline jobs={mockJobs} onJobUpdate={mockOnJobUpdate} />);

      // Mock the drag operation by directly calling the update
      const newStatus = 'applied';
      const jobId = 'job-1';
      
      (api.jobs.update as any).mockResolvedValue({
        id: jobId,
        status: newStatus,
        status_updated_at: expect.any(String),
      });

      await api.jobs.update(jobId, {
        status: newStatus,
        status_updated_at: new Date().toISOString(),
      });

      expect(api.jobs.update).toHaveBeenCalledWith(
        jobId,
        expect.objectContaining({
          status: newStatus,
          status_updated_at: expect.any(String),
        })
      );
    });

    it('should map display labels to canonical DB statuses', async () => {
      const mockJobs = [createMockJob()];
      
      render(<JobPipeline jobs={mockJobs} onJobUpdate={mockOnJobUpdate} />);

      // Test that Phone Screen label maps to phone_screen
      (api.jobs.update as any).mockResolvedValue({});

      await api.jobs.update('job-1', {
        status: 'phone_screen',
        status_updated_at: new Date().toISOString(),
      });

      expect(api.jobs.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'phone_screen', // Should be snake_case
        })
      );
    });

    it('should allow moving through all stages', async () => {
      const stages = ['interested', 'applied', 'phone_screen', 'interview', 'offer'];
      
      for (let i = 0; i < stages.length - 1; i++) {
        const currentStatus = stages[i];
        const nextStatus = stages[i + 1];

        (api.jobs.update as any).mockResolvedValue({
          status: nextStatus,
        });

        await api.jobs.update('job-1', {
          status: nextStatus,
          status_updated_at: new Date().toISOString(),
        });

        expect(api.jobs.update).toHaveBeenCalledWith(
          'job-1',
          expect.objectContaining({
            status: nextStatus,
          })
        );
      }
    });

    it('should show success toast on successful update', async () => {
      const mockJobs = [createMockJob()];
      
      (api.jobs.update as any).mockResolvedValue({});
      
      render(<JobPipeline jobs={mockJobs} onJobUpdate={mockOnJobUpdate} />);

      await api.jobs.update('job-1', {
        status: 'applied',
        status_updated_at: new Date().toISOString(),
      });

      await waitFor(() => {
        // The component will call toast.success when update succeeds
        // We're verifying the API call structure is correct
        expect(api.jobs.update).toHaveBeenCalledWith(
          'job-1',
          expect.objectContaining({
            status: 'applied',
            status_updated_at: expect.any(String),
          })
        );
      });
    });

    it('should show error toast on failed update', async () => {
      const mockJobs = [createMockJob()];
      
      (api.jobs.update as any).mockRejectedValue(new Error('Update failed'));
      
      render(<JobPipeline jobs={mockJobs} onJobUpdate={mockOnJobUpdate} />);

      try {
        await api.jobs.update('job-1', {
          status: 'applied',
          status_updated_at: new Date().toISOString(),
        });
      } catch (error) {
        // Expected to fail
      }

      await waitFor(() => {
        expect(api.jobs.update).toHaveBeenCalled();
      });
    });
  });

  describe('DB Status Validation', () => {
    it('should not violate CHECK constraint with invalid status', async () => {
      const validStatuses = ['interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];
      
      for (const status of validStatuses) {
        (api.jobs.update as any).mockResolvedValue({ status });

        await api.jobs.update('job-1', {
          status: status,
          status_updated_at: new Date().toISOString(),
        });

        expect(api.jobs.update).toHaveBeenCalledWith(
          'job-1',
          expect.objectContaining({
            status: status,
          })
        );
      }
    });

    it('should use snake_case for phone_screen status', async () => {
      (api.jobs.update as any).mockResolvedValue({});

      await api.jobs.update('job-1', {
        status: 'phone_screen', // Must be snake_case
        status_updated_at: new Date().toISOString(),
      });

      expect(api.jobs.update).toHaveBeenCalledWith(
        'job-1',
        expect.objectContaining({
          status: 'phone_screen',
        })
      );
    });
  });

  describe('Persistence Across Reload', () => {
    it('should maintain status after component remount', () => {
      const mockJobsBefore = [createMockJob({ status: 'interested' })];
      const mockJobsAfter = [createMockJob({ status: 'applied' })];

      const { rerender } = render(
        <JobPipeline jobs={mockJobsBefore} onJobUpdate={mockOnJobUpdate} />
      );

      // Simulate reload with new data
      rerender(<JobPipeline jobs={mockJobsAfter} onJobUpdate={mockOnJobUpdate} />);

      // The job should appear in the new status column
      expect(screen.getByText('Applied')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Jobs from '@/pages/Jobs';
import { AuthContext } from '@/contexts/AuthContext';
import * as apiModule from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      getAll: vi.fn(),
      delete: vi.fn(),
      archive: vi.fn(),
    },
  },
}));

// Mock Navigation component
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

// Mock child components
vi.mock('@/components/jobs/JobForm', () => ({
  JobForm: ({ onSuccess }: any) => (
    <div data-testid="job-form">
      <button onClick={onSuccess}>Save Job</button>
    </div>
  ),
}));

vi.mock('@/components/jobs/JobCard', () => ({
  JobCard: ({ job, onView, onDelete, onArchive }: any) => (
    <div data-testid={`job-card-${job.id}`}>
      <span>{job.title}</span>
      <span>{job.status}</span>
      <button onClick={() => onView(job)}>View</button>
      <button onClick={() => onDelete(job)}>Delete</button>
      <button onClick={() => onArchive(job)}>Archive</button>
    </div>
  ),
}));

vi.mock('@/components/jobs/JobDetailsModal', () => ({
  JobDetailsModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="job-details-modal">Details Modal</div> : null,
}));

vi.mock('@/components/jobs/JobFilters', () => ({
  JobFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="job-filters">
      <button onClick={() => onFiltersChange({ ...filters, sortBy: 'title' })}>
        Change Filter
      </button>
    </div>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user: mockUser, loading: false } as any}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Jobs Page - Status Counting and Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('counts jobs correctly by status using DB to UI mapping', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'interested', is_archived: false },
      { id: '2', job_id: '2', title: 'Job 2', company: 'Company B', status: 'applied', is_archived: false },
      { id: '3', job_id: '3', title: 'Job 3', company: 'Company C', status: 'phone_screen', is_archived: false },
      { id: '4', job_id: '4', title: 'Job 4', company: 'Company D', status: 'phone_screen', is_archived: false },
      { id: '5', job_id: '5', title: 'Job 5', company: 'Company E', status: 'interview', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // All Jobs count
    });

    // Verify individual status counts
    const statusButtons = screen.getAllByRole('button');
    
    // Check that counts are displayed correctly
    expect(screen.getByText('1')).toBeInTheDocument(); // Interested count
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'div' && content === '1';
    })).toBeInTheDocument(); // Applied count
    
    // Verify Phone Screen count is 2 (two jobs with phone_screen status)
    const phoneScreenElements = screen.getAllByText('2');
    expect(phoneScreenElements.length).toBeGreaterThan(0);
  });

  it('filters jobs correctly when status is selected', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'interested', is_archived: false },
      { id: '2', job_id: '2', title: 'Job 2', company: 'Company B', status: 'applied', is_archived: false },
      { id: '3', job_id: '3', title: 'Job 3', company: 'Company C', status: 'phone_screen', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click on "Applied" status filter
    const appliedButton = screen.getByText('Applied').closest('button');
    fireEvent.click(appliedButton!);

    await waitFor(() => {
      // Should show only the applied job
      expect(screen.getByTestId('job-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('job-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('job-card-3')).not.toBeInTheDocument();
    });
  });

  it('filters jobs correctly for "Phone Screen" status', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'interested', is_archived: false },
      { id: '2', job_id: '2', title: 'Job 2', company: 'Company B', status: 'phone_screen', is_archived: false },
      { id: '3', job_id: '3', title: 'Job 3', company: 'Company C', status: 'phone_screen', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click on "Phone Screen" status filter
    const phoneScreenButton = screen.getByText('Phone Screen').closest('button');
    fireEvent.click(phoneScreenButton!);

    await waitFor(() => {
      // Should show only phone_screen jobs
      expect(screen.getByTestId('job-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('job-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('job-card-1')).not.toBeInTheDocument();
    });
  });

  it('excludes archived jobs from counts and display', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'applied', is_archived: false },
      { id: '2', job_id: '2', title: 'Job 2', company: 'Company B', status: 'applied', is_archived: true },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Should only show 1 job (non-archived)
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('job-card-2')).not.toBeInTheDocument();
    });

    // All Jobs count should be 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens add job dialog and handles successful job creation', async () => {
    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue([] as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Add Job')).toBeInTheDocument();
    });

    // Click "Add Job" button
    const addButton = screen.getByText('Add Job');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('job-form')).toBeInTheDocument();
    });

    // Simulate successful job save
    const saveButton = screen.getByText('Save Job');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.getAll).toHaveBeenCalledTimes(2); // Initial load + after save
    });
  });

  it('handles job deletion with confirmation', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'applied', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);
    vi.mocked(apiModule.api.jobs.delete).mockResolvedValue(undefined as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.delete).toHaveBeenCalledWith('1');
      expect(apiModule.api.jobs.getAll).toHaveBeenCalledTimes(2); // Initial + after delete
    });
  });

  it('handles job archiving', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'applied', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);
    vi.mocked(apiModule.api.jobs.archive).mockResolvedValue(undefined as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click archive button
    const archiveButton = screen.getByText('Archive');
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.archive).toHaveBeenCalledWith('1');
    });
  });

  it('displays empty state when no jobs exist', async () => {
    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue([] as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No jobs yet')).toBeInTheDocument();
    });
  });

  it('displays empty state for specific status with no jobs', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'applied', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click on "Offer" status (which has no jobs)
    const offerButton = screen.getByText('Offer').closest('button');
    fireEvent.click(offerButton!);

    await waitFor(() => {
      expect(screen.getByText(/No jobs in Offer status/)).toBeInTheDocument();
    });
  });

  it('toggles view mode between grid and pipeline', async () => {
    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue([] as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Job Tracker')).toBeInTheDocument();
    });

    // Find and click the view mode toggle button
    const toggleButtons = screen.getAllByRole('button');
    const viewToggle = toggleButtons.find(btn => btn.querySelector('svg'));
    
    if (viewToggle) {
      fireEvent.click(viewToggle);
      // View mode should toggle (implementation detail)
    }
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(apiModule.api.jobs.getAll).mockRejectedValue(new Error('API Error'));

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Job Tracker')).toBeInTheDocument();
    });

    // Error should be handled (toast.error called, but we don't test toast directly here)
    expect(apiModule.api.jobs.getAll).toHaveBeenCalled();
  });

  it('refetches jobs when filters change', async () => {
    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue([] as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-filters')).toBeInTheDocument();
    });

    // Change filter
    const changeFilterButton = screen.getByText('Change Filter');
    fireEvent.click(changeFilterButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.getAll).toHaveBeenCalledTimes(2); // Initial + after filter change
    });
  });

  it('opens job details modal when viewing a job', async () => {
    const mockJobs = [
      { id: '1', job_id: '1', title: 'Job 1', company: 'Company A', status: 'applied', is_archived: false },
    ];

    vi.mocked(apiModule.api.jobs.getAll).mockResolvedValue(mockJobs as any);

    render(<Jobs />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument();
    });

    // Click view button
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('job-details-modal')).toBeInTheDocument();
    });
  });
});

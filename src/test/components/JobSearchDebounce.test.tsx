import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Jobs from '@/pages/Jobs';
import { api } from '@/lib/api';
import { AuthContext } from '@/contexts/AuthContext';

vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      getAll: vi.fn(),
      delete: vi.fn(),
      archive: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div>Navigation</div>,
}));

vi.mock('@/components/jobs/JobForm', () => ({
  JobForm: () => <div>JobForm</div>,
}));

vi.mock('@/components/jobs/JobCard', () => ({
  JobCard: ({ job }: any) => <div>{job.job_title}</div>,
}));

vi.mock('@/components/jobs/JobDetailsModal', () => ({
  JobDetailsModal: () => <div>JobDetailsModal</div>,
}));

vi.mock('@/components/jobs/JobPipeline', () => ({
  JobPipeline: () => <div>JobPipeline</div>,
}));

describe('Job Search Debouncing', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider
            value={{
              user: mockUser as any,
              session: null,
              profile: null,
              login: vi.fn(),
              loginWithToken: vi.fn(),
              logout: vi.fn(),
              register: vi.fn(),
              resetPassword: vi.fn(),
              updatePassword: vi.fn(),
              deleteAccount: vi.fn(),
              refreshProfile: vi.fn(),
              isLoading: false,
            }}
          >
            <Jobs />
          </AuthContext.Provider>
        </QueryClientProvider>
      </BrowserRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (api.jobs.getAll as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce search input with 300ms delay', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/search jobs/i);

    // Type quickly
    await user.type(searchInput, 'Soft');
    
    // Should not call API yet
    expect(api.jobs.getAll).toHaveBeenCalledTimes(1);

    // Fast forward 200ms - still not enough
    vi.advanceTimersByTime(200);
    expect(api.jobs.getAll).toHaveBeenCalledTimes(1);

    // Fast forward another 100ms - total 300ms
    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(2);
      expect(api.jobs.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Soft',
        })
      );
    });
  });

  it('should reset debounce timer on each keystroke', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/search jobs/i);

    // Type first character
    await user.type(searchInput, 'S');
    vi.advanceTimersByTime(200);

    // Type second character before 300ms elapsed
    await user.type(searchInput, 'o');
    vi.advanceTimersByTime(200);

    // Type third character before 300ms elapsed
    await user.type(searchInput, 'f');
    
    // Still only initial call
    expect(api.jobs.getAll).toHaveBeenCalledTimes(1);

    // Now wait full 300ms
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(2);
      expect(api.jobs.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Sof',
        })
      );
    });
  });

  it('should update results in real time after debounce delay', async () => {
    const user = userEvent.setup({ delay: null });
    const mockJobs = [
      {
        id: '1',
        job_title: 'Software Engineer',
        company_name: 'Test Co',
        status: 'interested',
        is_archived: false,
        created_at: new Date().toISOString(),
      },
    ];

    (api.jobs.getAll as any).mockResolvedValue(mockJobs);

    renderComponent();

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/search jobs/i);

    await user.type(searchInput, 'Software');
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(2);
      expect(api.jobs.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Software',
        })
      );
    });
  });

  it('should be ≤300ms debounce (not more)', async () => {
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(1);
    });

    const searchInput = screen.getByPlaceholderText(/search jobs/i);

    await user.type(searchInput, 'Test');
    
    // Should not have called yet
    expect(api.jobs.getAll).toHaveBeenCalledTimes(1);

    // Advance exactly 300ms
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(api.jobs.getAll).toHaveBeenCalledTimes(2);
    });
  });
});

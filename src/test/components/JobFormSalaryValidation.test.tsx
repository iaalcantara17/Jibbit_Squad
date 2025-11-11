import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobForm } from '@/components/jobs/JobForm';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      create: vi.fn(),
      update: vi.fn(),
      importFromUrl: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('JobForm - Salary Validation (Bug #6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows creating job with no salary fields (both optional)', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    // Fill required fields only
    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    // Select status
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Submit without salary
    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Software Engineer',
          company: 'Tech Corp',
          status: 'applied',
          // No salary fields
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('allows creating job with only minimum salary', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Set only minimum salary
    await userEvent.type(screen.getByLabelText(/minimum salary/i), '100000');

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          salary_min: 100000,
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('allows creating job with only maximum salary', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Set only maximum salary
    await userEvent.type(screen.getByLabelText(/maximum salary/i), '150000');

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          salary_max: 150000,
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('allows creating job with valid salary range (min < max)', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Set valid salary range
    await userEvent.type(screen.getByLabelText(/minimum salary/i), '100000');
    await userEvent.type(screen.getByLabelText(/maximum salary/i), '150000');

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          salary_min: 100000,
          salary_max: 150000,
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('allows creating job with equal min and max salary', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Set equal salary
    await userEvent.type(screen.getByLabelText(/minimum salary/i), '120000');
    await userEvent.type(screen.getByLabelText(/maximum salary/i), '120000');

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          salary_min: 120000,
          salary_max: 120000,
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows validation error when min salary > max salary', async () => {
    const onSuccess = vi.fn();

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    // Set invalid salary range (min > max)
    await userEvent.type(screen.getByLabelText(/minimum salary/i), '150000');
    await userEvent.type(screen.getByLabelText(/maximum salary/i), '100000');

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Should show validation error and NOT call create
      expect(screen.getByText(/minimum salary cannot be greater than maximum salary/i)).toBeInTheDocument();
      expect(apiModule.api.jobs.create).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('submits with correct DB status value (phone_screen)', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockResolvedValue({ id: '1' } as any);

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /phone screen/i }));

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'phone_screen', // DB value, not "Phone Screen"
        })
      );
    });
  });

  it('labels salary fields as optional', () => {
    render(<JobForm onSuccess={vi.fn()} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    // Check that salary fields are marked as optional
    expect(screen.getByText(/minimum salary/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum salary/i)).toBeInTheDocument();
    
    // Verify they don't have required asterisk or indicator
    const minSalaryLabel = screen.getByText(/minimum salary/i);
    expect(minSalaryLabel.textContent).not.toContain('*');
  });

  it('handles API errors gracefully', async () => {
    const onSuccess = vi.fn();
    vi.mocked(apiModule.api.jobs.create).mockRejectedValue(new Error('API Error'));

    render(<JobForm onSuccess={onSuccess} onCancel={vi.fn()} />, { wrapper: createWrapper() });

    await userEvent.type(screen.getByLabelText(/job title/i), 'Software Engineer');
    await userEvent.type(screen.getByLabelText(/company/i), 'Tech Corp');
    
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole('option', { name: /applied/i }));

    const submitButton = screen.getByRole('button', { name: /save job/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.api.jobs.create).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

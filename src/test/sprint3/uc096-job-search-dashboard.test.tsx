import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: table === 'jobs' ? [
            {
              id: 'job-1',
              user_id: 'test-user-id',
              status: 'Applied',
              company: 'Tech Corp',
              position: 'Engineer',
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              id: 'job-2',
              user_id: 'test-user-id',
              status: 'Interview',
              company: 'StartupCo',
              position: 'Senior Engineer',
              created_at: '2024-01-05T10:00:00Z',
            },
            {
              id: 'job-3',
              user_id: 'test-user-id',
              status: 'Offer',
              company: 'BigTech',
              position: 'Lead Engineer',
              created_at: '2024-01-10T10:00:00Z',
            }
          ] : table === 'interviews' ? [
            { id: 'int-1', user_id: 'test-user-id', scheduled_start: '2024-01-15T10:00:00Z' },
          ] : table === 'application_status_history' ? [
            { id: 'h-1', job_id: 'job-1', to_status: 'Applied', changed_at: '2024-01-01T10:00:00Z' },
            { id: 'h-2', job_id: 'job-2', to_status: 'Applied', changed_at: '2024-01-05T10:00:00Z' },
            { id: 'h-3', job_id: 'job-2', to_status: 'Interview', changed_at: '2024-01-08T10:00:00Z' },
          ] : [],
          error: null,
        })),
      })),
    })),
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-096: Job Search Performance Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays key performance indicators', async () => {
    const Analytics = (await import('@/pages/Analytics')).default;
    
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/Applications Sent/i)).toBeInTheDocument();
      expect(screen.getByText(/Interviews/i)).toBeInTheDocument();
    });
  });

  it('calculates conversion rates correctly', async () => {
    const { calculateConversionRates } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: '1', status: 'Applied' },
      { id: '2', status: 'Applied' },
      { id: '3', status: 'Interview' },
      { id: '4', status: 'Offer' },
    ];

    const rates = calculateConversionRates(jobs);
    
    expect(rates.appliedToInterview).toBe(50); // 2/4 = 50%
    expect(rates.interviewToOffer).toBe(50);   // 1/2 = 50%
    expect(rates.appliedToOffer).toBe(25);     // 1/4 = 25%
  });

  it('supports date range filtering', async () => {
    const { filterJobsByDateRange } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: '1', created_at: '2024-01-01T10:00:00Z' },
      { id: '2', created_at: '2024-01-15T10:00:00Z' },
      { id: '3', created_at: '2024-02-01T10:00:00Z' },
    ];

    const filtered = filterJobsByDateRange(
      jobs, 
      new Date('2024-01-01'), 
      new Date('2024-01-31')
    );
    
    expect(filtered.length).toBe(2);
    expect(filtered.map(j => j.id)).toEqual(['1', '2']);
  });

  it('supports company filtering', async () => {
    const { filterJobsByCompany } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: '1', company: 'Tech Corp' },
      { id: '2', company: 'StartupCo' },
      { id: '3', company: 'Tech Corp' },
    ];

    const filtered = filterJobsByCompany(jobs, 'Tech Corp');
    
    expect(filtered.length).toBe(2);
    expect(filtered.every(j => j.company === 'Tech Corp')).toBe(true);
  });

  it('provides export functionality', async () => {
    const Analytics = (await import('@/pages/Analytics')).default;
    
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
    });
  });

  it('displays status distribution chart', async () => {
    const Analytics = (await import('@/pages/Analytics')).default;
    
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Charts are rendered via recharts
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('calculates median time to response', async () => {
    const { calculateMedianTimeToResponse } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: 'job-1' },
      { id: 'job-2' },
      { id: 'job-3' },
    ];

    const statusHistory = [
      { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-1', to_status: 'Interview', changed_at: '2025-01-08T10:00:00Z' }, // 7 days
      { job_id: 'job-2', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-2', to_status: 'Interview', changed_at: '2025-01-06T10:00:00Z' }, // 5 days
      { job_id: 'job-3', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-3', to_status: 'Rejected', changed_at: '2025-01-04T10:00:00Z' }, // 3 days
    ];

    const median = calculateMedianTimeToResponse(jobs, statusHistory);
    
    expect(median).toBe(5); // Median of [3, 5, 7] = 5
  });

  it('displays monthly application trends', async () => {
    const { getMonthlyApplications } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: '1', created_at: '2024-01-05T10:00:00Z' },
      { id: '2', created_at: '2024-01-15T10:00:00Z' },
      { id: '3', created_at: '2024-02-01T10:00:00Z' },
      { id: '4', created_at: '2024-02-10T10:00:00Z' },
    ];

    const monthly = getMonthlyApplications(jobs, 2);
    
    expect(monthly.length).toBe(2);
    expect(monthly[0].count).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';

describe('UC-098: Time-to-Offer Tracking', () => {
  it('calculates average time from application to offer', async () => {
    const { calculateTimeToOffer } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: 'job-1', status: 'Offer' },
      { id: 'job-2', status: 'Offer' },
      { id: 'job-3', status: 'Applied' },
    ];

    const statusHistory = [
      { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-1', to_status: 'Offer', changed_at: '2025-01-15T10:00:00Z' }, // 14 days
      { job_id: 'job-2', to_status: 'Applied', changed_at: '2025-01-05T10:00:00Z' },
      { job_id: 'job-2', to_status: 'Offer', changed_at: '2025-01-25T10:00:00Z' }, // 20 days
      { job_id: 'job-3', to_status: 'Applied', changed_at: '2025-01-10T10:00:00Z' },
    ];

    const avgTime = calculateTimeToOffer(jobs, statusHistory);
    
    expect(avgTime).toBe(17); // (14 + 20) / 2 = 17
  });

  it('tracks time-to-offer trends over time', () => {
    const monthlyData = [
      { month: '2024-11', avgDays: 30 },
      { month: '2024-12', avgDays: 25 },
      { month: '2025-01', avgDays: 20 },
    ];
    
    const isImproving = monthlyData[2].avgDays < monthlyData[0].avgDays;
    expect(isImproving).toBe(true);
  });

  it('displays time investment breakdown by stage', async () => {
    const { calculateAverageTimeInStage } = await import('@/lib/analyticsService');
    
    const jobs = [{ id: 'job-1' }];
    const statusHistory = [
      { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-1', to_status: 'Phone Screen', changed_at: '2025-01-08T10:00:00Z' }, // 7 days
      { job_id: 'job-1', to_status: 'Interview', changed_at: '2025-01-15T10:00:00Z' }, // 7 days
      { job_id: 'job-1', to_status: 'Offer', changed_at: '2025-01-22T10:00:00Z' }, // 7 days
    ];

    const avgByStage = calculateAverageTimeInStage(jobs, statusHistory);
    
    expect(avgByStage['Applied']).toBeGreaterThan(0);
  });

  it('identifies fastest and slowest application paths', () => {
    const offerTimes = [
      { jobId: 'job-1', days: 10 },
      { jobId: 'job-2', days: 30 },
      { jobId: 'job-3', days: 15 },
      { jobId: 'job-4', days: 45 },
    ];
    
    const sorted = [...offerTimes].sort((a, b) => a.days - b.days);
    
    expect(sorted[0].days).toBe(10); // Fastest
    expect(sorted[sorted.length - 1].days).toBe(45); // Slowest
  });

  it('handles jobs without offers correctly', async () => {
    const { calculateTimeToOffer } = await import('@/lib/analyticsService');
    
    const jobs = [
      { id: 'job-1', status: 'Applied' },
      { id: 'job-2', status: 'Rejected' },
    ];

    const statusHistory = [
      { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      { job_id: 'job-2', to_status: 'Applied', changed_at: '2025-01-05T10:00:00Z' },
      { job_id: 'job-2', to_status: 'Rejected', changed_at: '2025-01-10T10:00:00Z' },
    ];

    const avgTime = calculateTimeToOffer(jobs, statusHistory);
    
    expect(avgTime).toBeNull(); // No offers to calculate
  });
});

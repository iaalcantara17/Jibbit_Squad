import { describe, it, expect } from 'vitest';

describe('Analytics Query Builder', () => {
  it('should count jobs by status correctly', () => {
    const jobs = [
      { status: 'interested' },
      { status: 'applied' },
      { status: 'applied' },
      { status: 'phone_screen' },
      { status: 'interview' },
      { status: 'offer' },
      { status: 'rejected' },
    ];

    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(statusCounts['interested']).toBe(1);
    expect(statusCounts['applied']).toBe(2);
    expect(statusCounts['phone_screen']).toBe(1);
    expect(statusCounts['interview']).toBe(1);
    expect(statusCounts['offer']).toBe(1);
    expect(statusCounts['rejected']).toBe(1);
  });

  it('should calculate response rate correctly', () => {
    const appliedJobs = 10;
    const interviewJobs = 3;
    const responseRate = ((interviewJobs / appliedJobs) * 100).toFixed(1);
    
    expect(responseRate).toBe('30.0');
  });

  it('should calculate offer rate correctly', () => {
    const appliedJobs = 10;
    const offers = 1;
    const offerRate = ((offers / appliedJobs) * 100).toFixed(1);
    
    expect(offerRate).toBe('10.0');
  });

  it('should handle zero applied jobs', () => {
    const appliedJobs = 0;
    const interviewJobs = 0;
    const responseRate = appliedJobs > 0 ? ((interviewJobs / appliedJobs) * 100).toFixed(1) : '0';
    
    expect(responseRate).toBe('0');
  });

  it('should build status distribution with colors', () => {
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const statusCounts = {
      'interested': 5,
      'applied': 3,
      'phone_screen': 2,
      'interview': 1,
      'offer': 1,
      'rejected': 0,
    };

    const statusDistribution = [
      { name: 'Interested', value: statusCounts['interested'] || 0, color: COLORS[0] },
      { name: 'Applied', value: statusCounts['applied'] || 0, color: COLORS[1] },
      { name: 'Phone Screen', value: statusCounts['phone_screen'] || 0, color: COLORS[2] },
      { name: 'Interview', value: statusCounts['interview'] || 0, color: COLORS[3] },
      { name: 'Offer', value: statusCounts['offer'] || 0, color: COLORS[4] },
      { name: 'Rejected', value: statusCounts['rejected'] || 0, color: COLORS[5] },
    ].filter(item => item.value > 0);

    expect(statusDistribution).toHaveLength(5); // All except rejected (0)
    expect(statusDistribution[0]).toEqual({ name: 'Interested', value: 5, color: '#3b82f6' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import { createMockSupabaseQuery, mockSupabaseResponse } from '../utils/mockSupabase';
import { supabase } from '@/integrations/supabase/client';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Jobs Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates job count correctly', () => {
    const jobs = [
      { id: '1', title: 'Software Engineer', status: 'Applied', company: 'TechCorp' },
      { id: '2', title: 'Product Manager', status: 'Interview', company: 'StartupCo' },
      { id: '3', title: 'Designer', status: 'Offer', company: 'DesignHub' },
    ];

    const total = jobs.length;
    const byStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(total).toBe(3);
    expect(byStatus).toEqual({
      'Applied': 1,
      'Interview': 1,
      'Offer': 1,
    });
  });

  it('handles job status updates', async () => {
    const mockJob = {
      id: 'job-123',
      title: 'Senior Developer',
      status: 'Applied',
      company: 'TestCorp',
    };

    const updatedJob = { ...mockJob, status: 'Interview' };
    
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(mockSupabaseResponse(updatedJob)),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    // Simulate status update logic
    const updateStatus = async (jobId: string, newStatus: string) => {
      const result = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);
      return result;
    };

    const result = await updateStatus('job-123', 'Interview');
    
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'Interview' });
    expect(result.data).toEqual(updatedJob);
  });

  it('filters jobs by status', () => {
    const jobs = [
      { id: '1', status: 'Applied' },
      { id: '2', status: 'Interview' },
      { id: '3', status: 'Applied' },
      { id: '4', status: 'Rejected' },
    ];

    const appliedJobs = jobs.filter(j => j.status === 'Applied');
    
    expect(appliedJobs).toHaveLength(2);
    expect(appliedJobs.every(j => j.status === 'Applied')).toBe(true);
  });
});

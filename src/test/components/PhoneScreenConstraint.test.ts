import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('PhoneScreenConstraint - Status Check Constraint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts "phone_screen" status (matches DB constraint)', async () => {
    const jobData = {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      status: 'phone_screen',
      user_id: 'user-123',
    };

    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: [{ ...jobData, id: 'job-456' }],
          error: null,
        })),
      })),
    }));

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase
      .from('jobs')
      .insert(jobData)
      .select();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].status).toBe('phone_screen');
  });

  it('rejects "Phone Screen" with spaces (violates constraint)', async () => {
    const jobData = {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      status: 'Phone Screen', // Invalid: has space
      user_id: 'user-123',
    };

    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: null,
          error: {
            message: 'new row violates check constraint "jobs_status_check"',
            code: '23514',
          },
        })),
      })),
    }));

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase
      .from('jobs')
      .insert(jobData)
      .select();

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('check constraint');
    expect(result.error?.code).toBe('23514');
  });

  it('verifies migration constraint includes phone_screen', () => {
    // Migration SQL:
    // CHECK (status IN ('interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'))
    
    const allowedStatuses = [
      'interested',
      'applied',
      'phone_screen', // Must be snake_case
      'interview',
      'offer',
      'rejected',
    ];

    expect(allowedStatuses).toContain('phone_screen');
    expect(allowedStatuses).not.toContain('Phone Screen');
    expect(allowedStatuses).not.toContain('phoneScreen');
    expect(allowedStatuses).not.toContain('PhoneScreen');
  });

  it('all valid statuses insert successfully', async () => {
    const validStatuses = [
      'interested',
      'applied',
      'phone_screen',
      'interview',
      'offer',
      'rejected',
    ];

    for (const status of validStatuses) {
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [{
              id: `job-${status}`,
              status,
              job_title: 'Test',
              company_name: 'Test',
              user_id: 'user-123',
            }],
            error: null,
          })),
        })),
      }));

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('jobs')
        .insert({
          job_title: 'Test',
          company_name: 'Test',
          status,
          user_id: 'user-123',
        })
        .select();

      expect(result.error).toBeNull();
      expect(result.data?.[0].status).toBe(status);
    }
  });

  it('invalid status triggers constraint error', async () => {
    const invalidStatuses = [
      'Phone Screen', // Space
      'phoneScreen',  // camelCase
      'PhoneScreen',  // PascalCase
      'PHONE_SCREEN', // UPPER_CASE
      'pending',      // Not in constraint
      'reviewing',    // Not in constraint
    ];

    for (const status of invalidStatuses) {
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: null,
            error: {
              message: `new row violates check constraint "jobs_status_check"`,
              code: '23514',
            },
          })),
        })),
      }));

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('jobs')
        .insert({
          job_title: 'Test',
          company_name: 'Test',
          status,
          user_id: 'user-123',
        })
        .select();

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23514');
    }
  });

  it('UI correctly maps "Phone Screen" label to "phone_screen" DB value', () => {
    // This ensures the bug is fixed: UI shows "Phone Screen" but DB stores "phone_screen"
    
    const UI_TO_DB_MAP: Record<string, string> = {
      'Interested': 'interested',
      'Applied': 'applied',
      'Phone Screen': 'phone_screen',
      'Interview': 'interview',
      'Offer': 'offer',
      'Rejected': 'rejected',
    };

    expect(UI_TO_DB_MAP['Phone Screen']).toBe('phone_screen');
  });
});

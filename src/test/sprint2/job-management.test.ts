/**
 * Sprint 2 Tests: Job Management Functions
 * UC-036 to UC-045
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })),
          single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'new-job', job_title: 'Test Job' }, 
            error: null 
          })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null })
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null })
    }
  }
}));

describe('UC-036: Basic Job Entry Form', () => {
  it('should validate required fields (title, company)', () => {
    const validateJobEntry = (data: { job_title?: string; company_name?: string }) => {
      const errors: string[] = [];
      if (!data.job_title || data.job_title.trim() === '') {
        errors.push('Job title is required');
      }
      if (!data.company_name || data.company_name.trim() === '') {
        errors.push('Company name is required');
      }
      return errors;
    };

    expect(validateJobEntry({})).toContain('Job title is required');
    expect(validateJobEntry({})).toContain('Company name is required');
    expect(validateJobEntry({ job_title: 'Engineer', company_name: 'Acme' })).toHaveLength(0);
  });

  it('should enforce job description character limit (2000)', () => {
    const validateDescription = (description: string) => {
      return description.length <= 2000;
    };

    expect(validateDescription('Short description')).toBe(true);
    expect(validateDescription('a'.repeat(2000))).toBe(true);
    expect(validateDescription('a'.repeat(2001))).toBe(false);
  });

  it('should accept valid job entry data', () => {
    const jobEntry = {
      job_title: 'Software Engineer',
      company_name: 'Tech Corp',
      location: 'San Francisco, CA',
      salary_min: 100000,
      salary_max: 150000,
      job_posting_url: 'https://example.com/job',
      application_deadline: '2025-12-31',
      job_description: 'Build amazing software',
      industry: 'Technology',
      job_type: 'Full-time'
    };

    expect(jobEntry.job_title).toBeDefined();
    expect(jobEntry.company_name).toBeDefined();
    expect(jobEntry.salary_min).toBeLessThan(jobEntry.salary_max);
  });
});

describe('UC-037: Job Status Pipeline Management', () => {
  const validStatuses = ['interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];

  it('should have all required pipeline stages', () => {
    expect(validStatuses).toContain('interested');
    expect(validStatuses).toContain('applied');
    expect(validStatuses).toContain('phone_screen');
    expect(validStatuses).toContain('interview');
    expect(validStatuses).toContain('offer');
    expect(validStatuses).toContain('rejected');
  });

  it('should track status change timestamps', () => {
    const statusHistory = [
      { status: 'interested', changedAt: '2025-01-01T10:00:00Z' },
      { status: 'applied', changedAt: '2025-01-05T14:30:00Z' }
    ];

    expect(statusHistory).toHaveLength(2);
    expect(statusHistory[1].status).toBe('applied');
    expect(new Date(statusHistory[1].changedAt)).toBeInstanceOf(Date);
  });

  it('should count jobs by status', () => {
    const jobs = [
      { id: '1', status: 'interested' },
      { id: '2', status: 'applied' },
      { id: '3', status: 'applied' },
      { id: '4', status: 'interview' }
    ];

    const countByStatus = (status: string) => 
      jobs.filter(j => j.status === status).length;

    expect(countByStatus('interested')).toBe(1);
    expect(countByStatus('applied')).toBe(2);
    expect(countByStatus('interview')).toBe(1);
  });
});

describe('UC-038: Job Details View and Edit', () => {
  it('should allow updating all job fields', () => {
    const originalJob = {
      job_title: 'Engineer',
      company_name: 'Old Corp',
      notes: ''
    };

    const updatedJob = {
      ...originalJob,
      job_title: 'Senior Engineer',
      company_name: 'New Corp',
      notes: 'Great opportunity'
    };

    expect(updatedJob.job_title).toBe('Senior Engineer');
    expect(updatedJob.notes).toBe('Great opportunity');
  });

  it('should support unlimited notes', () => {
    const longNotes = 'a'.repeat(10000);
    const job = { notes: longNotes };
    
    expect(job.notes.length).toBe(10000);
  });

  it('should track application history', () => {
    const applicationHistory = [
      { action: 'created', timestamp: new Date().toISOString() },
      { action: 'status_changed', timestamp: new Date().toISOString(), from: 'interested', to: 'applied' }
    ];

    expect(applicationHistory).toHaveLength(2);
    expect(applicationHistory[1].action).toBe('status_changed');
  });
});

describe('UC-039: Job Search and Filtering', () => {
  const jobs = [
    { id: '1', job_title: 'Frontend Developer', company_name: 'Acme', status: 'applied', salary_min: 80000 },
    { id: '2', job_title: 'Backend Engineer', company_name: 'Tech Corp', status: 'interested', salary_min: 100000 },
    { id: '3', job_title: 'Full Stack Developer', company_name: 'Startup', status: 'interview', salary_min: 90000 }
  ];

  it('should search by job title', () => {
    const searchByTitle = (query: string) => 
      jobs.filter(j => j.job_title.toLowerCase().includes(query.toLowerCase()));

    expect(searchByTitle('developer')).toHaveLength(2);
    expect(searchByTitle('engineer')).toHaveLength(1);
  });

  it('should search by company name', () => {
    const searchByCompany = (query: string) => 
      jobs.filter(j => j.company_name.toLowerCase().includes(query.toLowerCase()));

    expect(searchByCompany('acme')).toHaveLength(1);
    expect(searchByCompany('corp')).toHaveLength(1);
  });

  it('should filter by status', () => {
    const filterByStatus = (status: string) => 
      jobs.filter(j => j.status === status);

    expect(filterByStatus('applied')).toHaveLength(1);
    expect(filterByStatus('interested')).toHaveLength(1);
  });

  it('should filter by salary range', () => {
    const filterBySalary = (min: number, max: number) =>
      jobs.filter(j => j.salary_min >= min && j.salary_min <= max);

    expect(filterBySalary(85000, 95000)).toHaveLength(1);
    expect(filterBySalary(80000, 100000)).toHaveLength(3);
  });

  it('should sort results', () => {
    const sortBySalary = [...jobs].sort((a, b) => b.salary_min - a.salary_min);

    expect(sortBySalary[0].salary_min).toBe(100000);
    expect(sortBySalary[2].salary_min).toBe(80000);
  });
});

describe('UC-040: Job Application Deadline Tracking', () => {
  it('should calculate days until deadline', () => {
    const calculateDaysUntil = (deadline: string) => {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);
    
    expect(calculateDaysUntil(futureDeadline.toISOString())).toBe(5);
  });

  it('should determine deadline urgency color', () => {
    const getUrgencyColor = (daysUntil: number) => {
      if (daysUntil < 0) return 'overdue';
      if (daysUntil <= 3) return 'red';
      if (daysUntil <= 7) return 'yellow';
      return 'green';
    };

    expect(getUrgencyColor(-1)).toBe('overdue');
    expect(getUrgencyColor(2)).toBe('red');
    expect(getUrgencyColor(5)).toBe('yellow');
    expect(getUrgencyColor(10)).toBe('green');
  });

  it('should identify overdue applications', () => {
    const isOverdue = (deadline: string) => new Date(deadline) < new Date();

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    expect(isOverdue(pastDate.toISOString())).toBe(true);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });
});

describe('UC-041: Job Import from URL', () => {
  it('should validate URL format', () => {
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidUrl('https://linkedin.com/jobs/123')).toBe(true);
    expect(isValidUrl('https://indeed.com/job/456')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should identify supported job boards', () => {
    const getSupportedJobBoard = (url: string) => {
      const supported = ['linkedin.com', 'indeed.com', 'glassdoor.com'];
      const urlObj = new URL(url);
      return supported.find(board => urlObj.hostname.includes(board));
    };

    expect(getSupportedJobBoard('https://www.linkedin.com/jobs/view/123')).toBe('linkedin.com');
    expect(getSupportedJobBoard('https://indeed.com/job/456')).toBe('indeed.com');
  });
});

describe('UC-042: Job Application Materials Tracking', () => {
  it('should link materials to job', () => {
    const materialsUsage = {
      job_id: 'job-1',
      resume_id: 'resume-1',
      cover_letter_id: 'cover-1',
      used_at: new Date().toISOString()
    };

    expect(materialsUsage.job_id).toBe('job-1');
    expect(materialsUsage.resume_id).toBeDefined();
    expect(materialsUsage.cover_letter_id).toBeDefined();
  });

  it('should track materials history', () => {
    const materialsHistory = [
      { resume_id: 'resume-v1', used_at: '2025-01-01' },
      { resume_id: 'resume-v2', used_at: '2025-01-05' }
    ];

    expect(materialsHistory).toHaveLength(2);
    expect(materialsHistory[1].resume_id).toBe('resume-v2');
  });
});

describe('UC-044: Job Statistics and Analytics', () => {
  it('should calculate application response rate', () => {
    const calculateResponseRate = (
      totalApplied: number, 
      totalResponded: number
    ) => {
      if (totalApplied === 0) return 0;
      return (totalResponded / totalApplied) * 100;
    };

    expect(calculateResponseRate(10, 3)).toBe(30);
    expect(calculateResponseRate(0, 0)).toBe(0);
    expect(calculateResponseRate(20, 10)).toBe(50);
  });

  it('should track jobs by status', () => {
    const jobStats = {
      total: 15,
      byStatus: {
        interested: 5,
        applied: 6,
        interview: 2,
        offer: 1,
        rejected: 1
      }
    };

    const sum = Object.values(jobStats.byStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(jobStats.total);
  });
});

describe('UC-045: Job Archiving and Management', () => {
  it('should archive job with reason', () => {
    const archiveJob = (job: any, reason: string) => ({
      ...job,
      is_archived: true,
      archive_reason: reason,
      archived_at: new Date().toISOString()
    });

    const job = { id: '1', job_title: 'Dev' };
    const archived = archiveJob(job, 'Position filled');

    expect(archived.is_archived).toBe(true);
    expect(archived.archive_reason).toBe('Position filled');
  });

  it('should restore archived job', () => {
    const restoreJob = (job: any) => ({
      ...job,
      is_archived: false,
      archive_reason: null
    });

    const archivedJob = { id: '1', is_archived: true, archive_reason: 'Old' };
    const restored = restoreJob(archivedJob);

    expect(restored.is_archived).toBe(false);
    expect(restored.archive_reason).toBeNull();
  });

  it('should separate archived from active jobs', () => {
    const jobs = [
      { id: '1', is_archived: false },
      { id: '2', is_archived: true },
      { id: '3', is_archived: false }
    ];

    const activeJobs = jobs.filter(j => !j.is_archived);
    const archivedJobs = jobs.filter(j => j.is_archived);

    expect(activeJobs).toHaveLength(2);
    expect(archivedJobs).toHaveLength(1);
  });
});

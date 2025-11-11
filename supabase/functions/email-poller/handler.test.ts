import { describe, it, expect, vi } from 'vitest';
import { detectStatus, runEmailPoller, type PollerDeps, type EmailMessage } from './handler.ts';

describe('detectStatus', () => {
  it('detects Applied status', () => {
    expect(detectStatus('Thanks for applying to our position')).toBe('Applied');
    expect(detectStatus('We received your application')).toBe('Applied');
    expect(detectStatus('Application submitted successfully')).toBe('Applied');
    expect(detectStatus('We have received your resume')).toBe('Applied');
  });

  it('detects Phone Screen status', () => {
    expect(detectStatus('Recruiter call scheduled')).toBe('Phone Screen');
    expect(detectStatus('Phone screen invitation')).toBe('Phone Screen');
    expect(detectStatus('Initial conversation about the role')).toBe('Phone Screen');
    expect(detectStatus('Screening call tomorrow')).toBe('Phone Screen');
  });

  it('detects Interview status', () => {
    expect(detectStatus('Interview invitation')).toBe('Interview');
    expect(detectStatus('Onsite interview next week')).toBe('Interview');
    expect(detectStatus('Virtual interview scheduled')).toBe('Interview');
    expect(detectStatus('Schedule an interview with us')).toBe('Interview');
  });

  it('detects Offer status', () => {
    expect(detectStatus('Offer letter attached')).toBe('Offer');
    expect(detectStatus('Job offer from TechCorp')).toBe('Offer');
    expect(detectStatus('Compensation package details')).toBe('Offer');
    expect(detectStatus('Employment offer')).toBe('Offer');
  });

  it('detects Rejected status', () => {
    expect(detectStatus('We regret to inform you')).toBe('Rejected');
    expect(detectStatus('Unfortunately we are not moving forward')).toBe('Rejected');
    expect(detectStatus('Decided to pursue other candidates')).toBe('Rejected');
    expect(detectStatus('You were not selected')).toBe('Rejected');
    expect(detectStatus('Application was unsuccessful')).toBe('Rejected');
  });

  it('returns null for unmatched text', () => {
    expect(detectStatus('General newsletter')).toBeNull();
    expect(detectStatus('Meeting reminder')).toBeNull();
    expect(detectStatus('Company announcement')).toBeNull();
    expect(detectStatus('')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(detectStatus('THANKS FOR APPLYING')).toBe('Applied');
    expect(detectStatus('Phone Screen')).toBe('Phone Screen');
  });
});

describe('runEmailPoller', () => {
  const mockMessages: EmailMessage[] = [
    {
      id: 'msg1',
      subject: 'Thanks for applying',
      snippet: 'We received your application',
      from: 'jobs@techcorp.com',
      date: '2024-01-15T10:00:00Z',
    },
    {
      id: 'msg2',
      subject: 'Interview invitation',
      snippet: 'Schedule your interview',
      from: 'hr@startup.com',
      date: '2024-01-16T10:00:00Z',
    },
    {
      id: 'msg1', // duplicate
      subject: 'Thanks for applying',
      snippet: 'We received your application',
      from: 'jobs@techcorp.com',
      date: '2024-01-15T10:00:00Z',
    },
  ];

  it('processes messages and deduplicates', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn()
          .mockResolvedValueOnce('inserted') // msg1
          .mockResolvedValueOnce('inserted') // msg2
          .mockResolvedValueOnce('skipped'),  // msg1 duplicate
        matchJob: vi.fn().mockResolvedValue('job-123'),
        updateJobStatus: vi.fn().mockResolvedValue(undefined),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue(mockMessages),
      },
      userId: 'user-123',
      now: new Date('2024-01-20T00:00:00Z'),
    };

    const result = await runEmailPoller(deps);

    expect(result).toEqual({
      inserted: 2,
      updated: 0,
      skipped: 1,
      detectedCount: 2,
    });

    expect(deps.supabase.upsertEmail).toHaveBeenCalledTimes(3);
    expect(deps.supabase.matchJob).toHaveBeenCalledTimes(2);
    expect(deps.supabase.updateJobStatus).toHaveBeenCalledTimes(2);
    expect(deps.supabase.updateJobStatus).toHaveBeenCalledWith('job-123', 'Applied', expect.any(Date));
    expect(deps.supabase.updateJobStatus).toHaveBeenCalledWith('job-123', 'Interview', expect.any(Date));
  });

  it('handles emails with no status detected', async () => {
    const noStatusMessages: EmailMessage[] = [
      {
        id: 'msg3',
        subject: 'Company newsletter',
        snippet: 'Latest updates from our team',
        from: 'news@company.com',
        date: '2024-01-15T10:00:00Z',
      },
    ];

    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn().mockResolvedValue('inserted'),
        matchJob: vi.fn(),
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue(noStatusMessages),
      },
      userId: 'user-123',
      now: new Date('2024-01-20T00:00:00Z'),
    };

    const result = await runEmailPoller(deps);

    expect(result).toEqual({
      inserted: 1,
      updated: 0,
      skipped: 0,
      detectedCount: 0,
    });

    expect(deps.supabase.matchJob).not.toHaveBeenCalled();
    expect(deps.supabase.updateJobStatus).not.toHaveBeenCalled();
  });

  it('handles no job match path', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn().mockResolvedValue('inserted'),
        matchJob: vi.fn().mockResolvedValue(null), // No job found
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue([mockMessages[0]]),
      },
      userId: 'user-123',
      now: new Date('2024-01-20T00:00:00Z'),
    };

    const result = await runEmailPoller(deps);

    expect(result.detectedCount).toBe(1);
    expect(deps.supabase.matchJob).toHaveBeenCalled();
    expect(deps.supabase.updateJobStatus).not.toHaveBeenCalled();
  });

  it('fetches emails from last 14 days', async () => {
    const now = new Date('2024-01-20T12:00:00Z');
    const expectedSince = new Date('2024-01-06T12:00:00Z');

    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn().mockResolvedValue('skipped'),
        matchJob: vi.fn(),
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue([]),
      },
      userId: 'user-123',
      now,
    };

    await runEmailPoller(deps);

    expect(deps.gmail.listMessages).toHaveBeenCalledWith(expectedSince.toISOString());
  });

  it('handles Gmail API errors gracefully', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn(),
        matchJob: vi.fn(),
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockRejectedValue(new Error('Gmail API 429: Rate limit exceeded')),
      },
      userId: 'user-123',
      now: new Date('2024-01-20T00:00:00Z'),
    };

    await expect(runEmailPoller(deps)).rejects.toThrow('Gmail API 429');
  });
});

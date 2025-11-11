import { describe, it, expect, vi } from 'vitest';
import { runEmailPoller, detectStatus } from './handler.ts';
import type { PollerDeps } from './handler.ts';

describe('email-poller handler - Negative Paths', () => {
  it('skips duplicate messages (dedupe by provider_msg_id)', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn()
          .mockResolvedValueOnce('inserted')
          .mockResolvedValueOnce('skipped'), // Duplicate
        matchJob: vi.fn().mockResolvedValue('job-123'),
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue([
          { id: 'msg-1', subject: 'Thanks for applying', snippet: '', from: 'hr@company.com', date: '2025-01-10T10:00:00Z' },
          { id: 'msg-1', subject: 'Thanks for applying', snippet: '', from: 'hr@company.com', date: '2025-01-10T10:00:00Z' }, // Duplicate
        ]),
      },
      userId: 'user-123',
      now: new Date('2025-01-15T12:00:00Z'),
    };

    const result = await runEmailPoller(deps);

    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
    expect(deps.supabase.updateJobStatus).toHaveBeenCalledTimes(1); // Only once for non-duplicate
  });

  it('inserts email even when no job match found', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn().mockResolvedValue('inserted'),
        matchJob: vi.fn().mockResolvedValue(null), // No match
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockResolvedValue([
          { id: 'msg-orphan', subject: 'Interview invitation', snippet: '', from: 'unknown@company.com', date: '2025-01-10T10:00:00Z' },
        ]),
      },
      userId: 'user-123',
      now: new Date('2025-01-15T12:00:00Z'),
    };

    const result = await runEmailPoller(deps);

    expect(result.inserted).toBe(1);
    expect(result.detectedCount).toBe(1); // Status detected
    expect(deps.supabase.updateJobStatus).not.toHaveBeenCalled(); // No job to update
  });

  it('does not detect status for non-matching strings', () => {
    expect(detectStatus('Hello, how are you?')).toBe(null);
    expect(detectStatus('Random newsletter content')).toBe(null);
    expect(detectStatus('Your order has shipped')).toBe(null);
    expect(detectStatus('')).toBe(null);
  });

  it('normalizes Gmail 429 error', async () => {
    const deps: PollerDeps = {
      supabase: {
        upsertEmail: vi.fn(),
        matchJob: vi.fn(),
        updateJobStatus: vi.fn(),
      },
      gmail: {
        listMessages: vi.fn().mockRejectedValue({
          code: 429,
          message: 'Rate limit exceeded',
        }),
      },
      userId: 'user-123',
      now: new Date('2025-01-15T12:00:00Z'),
    };

    await expect(runEmailPoller(deps)).rejects.toMatchObject({
      code: 429,
      message: 'Rate limit exceeded',
    });
  });
});

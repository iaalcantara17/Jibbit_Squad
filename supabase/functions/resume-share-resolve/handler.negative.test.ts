import { describe, it, expect, vi } from 'vitest';
import { resolveShare } from './handler.ts';
import type { ResolveDeps } from './handler.ts';

describe('resume-share-resolve handler - Negative Paths', () => {
  it('returns error for invalid token', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(null),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('invalid-token', deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_TOKEN');
    expect(result.error?.message).toBe('Share link not found');
  });

  it('returns error for inactive share', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({
          id: 'share-1',
          resume_id: 'resume-1',
          user_id: 'user-1',
          share_token: 'valid-token',
          is_active: false, // Revoked
          expires_at: null,
          can_comment: true,
        }),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('valid-token', deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INACTIVE_SHARE');
    expect(result.error?.message).toBe('This share link has been revoked');
  });

  it('returns error for expired share', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({
          id: 'share-1',
          resume_id: 'resume-1',
          user_id: 'user-1',
          share_token: 'valid-token',
          is_active: true,
          expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
          can_comment: true,
        }),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('valid-token', deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EXPIRED_SHARE');
    expect(result.error?.message).toBe('This share link has expired');
  });

  it('returns error when resume not found', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({
          id: 'share-1',
          resume_id: 'resume-deleted',
          user_id: 'user-1',
          share_token: 'valid-token',
          is_active: true,
          expires_at: null,
          can_comment: true,
        }),
        getResume: vi.fn().mockResolvedValue(null), // Resume deleted
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('valid-token', deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('RESUME_NOT_FOUND');
    expect(result.error?.message).toBe('Resume not found');
  });
});

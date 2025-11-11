import { describe, it, expect, vi } from 'vitest';
import { resolveShare, type ResolveDeps, type ShareData, type ResumeData } from './handler.ts';

describe('resolveShare', () => {
  const mockShare: ShareData = {
    id: 'share-123',
    resume_id: 'resume-456',
    user_id: 'user-789',
    share_token: 'abc123def456',
    is_active: true,
    expires_at: null,
    can_comment: true,
  };

  const mockResume: ResumeData = {
    id: 'resume-456',
    title: 'Software Engineer Resume',
    sections: { experience: [], education: [] },
    styling: { fontSize: 11 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  };

  const mockComments = [
    {
      id: 'comment-1',
      author_name: 'Jane Reviewer',
      body: 'Great resume!',
      created_at: '2024-01-15T00:00:00Z',
    },
  ];

  it('resolves valid share link', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(mockShare),
        getResume: vi.fn().mockResolvedValue(mockResume),
        getComments: vi.fn().mockResolvedValue(mockComments),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result).toEqual({
      success: true,
      data: {
        resume: mockResume,
        comments: mockComments,
        canComment: true,
      },
    });
  });

  it('rejects invalid token', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(null),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('invalid-token', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Share link not found',
      },
    });
  });

  it('rejects inactive share', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, is_active: false }),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'INACTIVE_SHARE',
        message: 'This share link has been revoked',
      },
    });
  });

  it('rejects expired share', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, expires_at: pastDate }),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'EXPIRED_SHARE',
        message: 'This share link has expired',
      },
    });
  });

  it('allows share without expiry', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, expires_at: null }),
        getResume: vi.fn().mockResolvedValue(mockResume),
        getComments: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result.success).toBe(true);
  });

  it('allows share with future expiry', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, expires_at: futureDate }),
        getResume: vi.fn().mockResolvedValue(mockResume),
        getComments: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result.success).toBe(true);
  });

  it('handles missing resume', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(mockShare),
        getResume: vi.fn().mockResolvedValue(null),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'RESUME_NOT_FOUND',
        message: 'Resume not found',
      },
    });
  });

  it('includes canComment flag in response', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, can_comment: false }),
        getResume: vi.fn().mockResolvedValue(mockResume),
        getComments: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result.success).toBe(true);
    expect(result.data?.canComment).toBe(false);
  });

  it('handles database errors gracefully', async () => {
    const deps: ResolveDeps = {
      supabase: {
        getShareByToken: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        getResume: vi.fn(),
        getComments: vi.fn(),
      },
    };

    const result = await resolveShare('abc123def456', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'RESOLVE_FAILED',
        message: 'Database connection failed',
      },
    });
  });
});

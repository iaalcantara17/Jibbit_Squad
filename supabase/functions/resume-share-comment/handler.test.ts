import { describe, it, expect, vi } from 'vitest';
import { validateComment, postComment, type CommentDeps, type CommentInput } from './handler.ts';

describe('validateComment', () => {
  it('accepts valid comment', () => {
    const comment: CommentInput = {
      author_name: 'Jane Doe',
      body: 'This is a great resume!',
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(true);
  });

  it('rejects empty author name', () => {
    const comment: CommentInput = {
      author_name: '',
      body: 'Great resume!',
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Author name is required');
  });

  it('rejects whitespace-only author name', () => {
    const comment: CommentInput = {
      author_name: '   ',
      body: 'Great resume!',
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Author name is required');
  });

  it('rejects author name over 100 characters', () => {
    const comment: CommentInput = {
      author_name: 'A'.repeat(101),
      body: 'Great resume!',
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Author name must be less than 100 characters');
  });

  it('rejects empty body', () => {
    const comment: CommentInput = {
      author_name: 'Jane Doe',
      body: '',
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Comment body is required');
  });

  it('rejects body over 2000 characters', () => {
    const comment: CommentInput = {
      author_name: 'Jane Doe',
      body: 'A'.repeat(2001),
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Comment must be less than 2000 characters');
  });

  it('accepts body at 2000 characters', () => {
    const comment: CommentInput = {
      author_name: 'Jane Doe',
      body: 'A'.repeat(2000),
    };
    
    const result = validateComment(comment);
    expect(result.valid).toBe(true);
  });
});

describe('postComment', () => {
  const validComment: CommentInput = {
    author_name: 'Jane Reviewer',
    body: 'Excellent experience section!',
  };

  const mockShare = {
    id: 'share-123',
    is_active: true,
    expires_at: null,
    can_comment: true,
  };

  it('posts comment successfully', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(mockShare),
        insertComment: vi.fn().mockResolvedValue({ id: 'comment-456' }),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result).toEqual({
      success: true,
      commentId: 'comment-456',
    });
    expect(deps.supabase.insertComment).toHaveBeenCalledWith('share-123', validComment);
  });

  it('rejects invalid token', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(null),
        insertComment: vi.fn(),
      },
    };

    const result = await postComment('invalid-token', validComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Share link not found',
      },
    });
    expect(deps.supabase.insertComment).not.toHaveBeenCalled();
  });

  it('rejects inactive share', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, is_active: false }),
        insertComment: vi.fn(),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'INACTIVE_SHARE',
        message: 'This share link has been revoked',
      },
    });
  });

  it('rejects expired share', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, expires_at: pastDate }),
        insertComment: vi.fn(),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'EXPIRED_SHARE',
        message: 'This share link has expired',
      },
    });
  });

  it('rejects when comments are disabled', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, can_comment: false }),
        insertComment: vi.fn(),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'COMMENTS_DISABLED',
        message: 'Comments are not enabled for this share link',
      },
    });
    expect(deps.supabase.insertComment).not.toHaveBeenCalled();
  });

  it('rejects invalid comment input', async () => {
    const invalidComment: CommentInput = {
      author_name: '',
      body: 'Valid body',
    };

    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn(),
        insertComment: vi.fn(),
      },
    };

    const result = await postComment('abc123def456', invalidComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Author name is required',
      },
    });
    expect(deps.supabase.getShareByToken).not.toHaveBeenCalled();
  });

  it('handles database errors', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue(mockShare),
        insertComment: vi.fn().mockRejectedValue(new Error('Database error')),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'COMMENT_FAILED',
        message: 'Database error',
      },
    });
  });

  it('allows share with future expiry', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({ ...mockShare, expires_at: futureDate }),
        insertComment: vi.fn().mockResolvedValue({ id: 'comment-789' }),
      },
    };

    const result = await postComment('abc123def456', validComment, deps);

    expect(result.success).toBe(true);
    expect(result.commentId).toBe('comment-789');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { postComment, validateComment } from './handler.ts';
import type { CommentDeps, CommentInput } from './handler.ts';

describe('resume-share-comment handler - Negative Paths', () => {
  it('returns error when can_comment is false', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({
          id: 'share-1',
          is_active: true,
          expires_at: null,
          can_comment: false, // Comments disabled
        }),
        insertComment: vi.fn(),
      },
    };

    const comment: CommentInput = {
      author_name: 'John Doe',
      body: 'Great resume!',
    };

    const result = await postComment('valid-token', comment, deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('COMMENTS_DISABLED');
    expect(result.error?.message).toBe('Comments are not enabled for this share link');
  });

  it('validates author_name length', () => {
    const tooLong = { author_name: 'a'.repeat(101), body: 'Test' };
    const validation = validateComment(tooLong);
    
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Author name must be less than 100 characters');
  });

  it('validates comment body length', () => {
    const tooLong = { author_name: 'John', body: 'a'.repeat(2001) };
    const validation = validateComment(tooLong);
    
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Comment must be less than 2000 characters');
  });

  it('validates required author_name', () => {
    const empty = { author_name: '', body: 'Test' };
    const validation = validateComment(empty);
    
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Author name is required');
  });

  it('validates required body', () => {
    const empty = { author_name: 'John', body: '' };
    const validation = validateComment(empty);
    
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Comment body is required');
  });

  it('returns error for expired share', async () => {
    const deps: CommentDeps = {
      supabase: {
        getShareByToken: vi.fn().mockResolvedValue({
          id: 'share-1',
          is_active: true,
          expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired
          can_comment: true,
        }),
        insertComment: vi.fn(),
      },
    };

    const comment: CommentInput = {
      author_name: 'John Doe',
      body: 'Great resume!',
    };

    const result = await postComment('valid-token', comment, deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EXPIRED_SHARE');
  });
});

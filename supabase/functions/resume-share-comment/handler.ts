// Pure resume comment logic - fully testable

export type CommentInput = {
  author_name: string;
  body: string;
};

export type CommentDeps = {
  supabase: {
    getShareByToken: (token: string) => Promise<{
      id: string;
      is_active: boolean;
      expires_at: string | null;
      can_comment: boolean;
    } | null>;
    insertComment: (shareId: string, comment: CommentInput) => Promise<{ id: string }>;
  };
};

export type CommentResult = {
  success: boolean;
  commentId?: string;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Validate input lengths
 */
export function validateComment(comment: CommentInput): { valid: boolean; error?: string } {
  if (!comment.author_name || comment.author_name.trim().length === 0) {
    return { valid: false, error: 'Author name is required' };
  }
  
  if (comment.author_name.length > 100) {
    return { valid: false, error: 'Author name must be less than 100 characters' };
  }
  
  if (!comment.body || comment.body.trim().length === 0) {
    return { valid: false, error: 'Comment body is required' };
  }
  
  if (comment.body.length > 2000) {
    return { valid: false, error: 'Comment must be less than 2000 characters' };
  }
  
  return { valid: true };
}

/**
 * Post a comment on a shared resume
 */
export async function postComment(token: string, comment: CommentInput, deps: CommentDeps): Promise<CommentResult> {
  try {
    // Validate input
    const validation = validateComment(comment);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error!,
        },
      };
    }
    
    // Get share record
    const share = await deps.supabase.getShareByToken(token);
    
    if (!share) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Share link not found',
        },
      };
    }
    
    // Check if active
    if (!share.is_active) {
      return {
        success: false,
        error: {
          code: 'INACTIVE_SHARE',
          message: 'This share link has been revoked',
        },
      };
    }
    
    // Check expiry
    if (share.expires_at) {
      const expiry = new Date(share.expires_at);
      const now = new Date();
      
      if (now > expiry) {
        return {
          success: false,
          error: {
            code: 'EXPIRED_SHARE',
            message: 'This share link has expired',
          },
        };
      }
    }
    
    // Check if comments are allowed
    if (!share.can_comment) {
      return {
        success: false,
        error: {
          code: 'COMMENTS_DISABLED',
          message: 'Comments are not enabled for this share link',
        },
      };
    }
    
    // Insert comment
    const result = await deps.supabase.insertComment(share.id, comment);
    
    return {
      success: true,
      commentId: result.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'COMMENT_FAILED',
        message: error.message || 'Failed to post comment',
      },
    };
  }
}

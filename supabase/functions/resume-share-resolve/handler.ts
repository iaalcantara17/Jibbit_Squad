// Pure resume share resolution logic - fully testable

export type ShareData = {
  id: string;
  resume_id: string;
  user_id: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  can_comment: boolean;
};

export type ResumeData = {
  id: string;
  title: string;
  sections: any;
  styling: any;
  created_at: string;
  updated_at: string;
};

export type CommentData = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type ResolveDeps = {
  supabase: {
    getShareByToken: (token: string) => Promise<ShareData | null>;
    getResume: (resumeId: string) => Promise<ResumeData | null>;
    getComments: (shareId: string) => Promise<CommentData[]>;
  };
};

export type ResolveResult = {
  success: boolean;
  data?: {
    resume: ResumeData;
    comments: CommentData[];
    canComment: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Validate share link and return resume + comments if valid
 */
export async function resolveShare(token: string, deps: ResolveDeps): Promise<ResolveResult> {
  try {
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
    
    // Get resume
    const resume = await deps.supabase.getResume(share.resume_id);
    
    if (!resume) {
      return {
        success: false,
        error: {
          code: 'RESUME_NOT_FOUND',
          message: 'Resume not found',
        },
      };
    }
    
    // Get comments
    const comments = await deps.supabase.getComments(share.id);
    
    return {
      success: true,
      data: {
        resume,
        comments,
        canComment: share.can_comment,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'RESOLVE_FAILED',
        message: error.message || 'Failed to resolve share link',
      },
    };
  }
}

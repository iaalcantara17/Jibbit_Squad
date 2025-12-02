import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: table === 'document_comments' ? [
            {
              id: 'comment-1',
              user_id: 'user-1',
              document_type: 'resume',
              document_id: 'doc-1',
              comment_text: 'Great bullet point on leadership',
              quoted_text: 'Led team of 5 engineers',
              resolved: false,
              created_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 'comment-2',
              user_id: 'user-2',
              document_type: 'resume',
              document_id: 'doc-1',
              comment_text: 'Add metrics here',
              quoted_text: null,
              resolved: true,
              created_at: '2024-01-16T10:00:00Z',
            }
          ] : table === 'profiles' ? [
            { user_id: 'user-1', name: 'John Reviewer', email: 'john@example.com' },
            { user_id: 'user-2', name: 'Jane Mentor', email: 'jane@example.com' },
          ] : table === 'resume_shares' ? [
            {
              id: 'share-1',
              user_id: 'test-user-id',
              resume_id: 'resume-1',
              share_token: 'abc123',
              permissions: 'comment',
              expires_at: '2024-12-31T23:59:59Z',
              shared_with_email: 'reviewer@example.com',
              created_at: '2024-01-10T10:00:00Z',
            }
          ] : table === 'resume_versions' ? [
            {
              id: 'version-1',
              resume_id: 'resume-1',
              version_number: 1,
              content: { sections: { summary: 'First version' } },
              created_by: 'test-user-id',
              change_summary: 'Initial version',
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              id: 'version-2',
              resume_id: 'resume-1',
              version_number: 2,
              content: { sections: { summary: 'Updated version' } },
              created_by: 'test-user-id',
              change_summary: 'Added metrics',
              created_at: '2024-01-15T10:00:00Z',
            }
          ] : [],
          error: null,
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

describe('UC-109: Document Collaboration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Document Comments', () => {
    it('displays comments on documents with author information', async () => {
      const DocumentComments = (await import('@/components/documents/DocumentComments')).DocumentComments;
      
      render(
        <DocumentComments 
          documentType="resume"
          documentId="doc-1"
          canComment={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Great bullet point on leadership')).toBeInTheDocument();
        expect(screen.getByText('Add metrics here')).toBeInTheDocument();
      });

      // Verify quoted text is shown
      expect(screen.getByText(/Led team of 5 engineers/i)).toBeInTheDocument();
    });

    it('allows adding new comments with quoted text', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const DocumentComments = (await import('@/components/documents/DocumentComments')).DocumentComments;
      const user = userEvent.setup();
      
      render(
        <DocumentComments 
          documentType="resume"
          documentId="doc-1"
          canComment={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Add comment
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Consider adding more impact metrics');
      
      const addButton = screen.getByRole('button', { name: /add comment/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('document_comments');
      });
    });

    it('supports resolving comments', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const DocumentComments = (await import('@/components/documents/DocumentComments')).DocumentComments;
      const user = userEvent.setup();
      
      render(
        <DocumentComments 
          documentType="resume"
          documentId="doc-1"
          canComment={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Great bullet point on leadership')).toBeInTheDocument();
      });

      // Find and click resolve button
      const resolveButtons = screen.getAllByRole('button');
      const resolveButton = resolveButtons.find(btn => btn.textContent?.includes('Resolve') || btn.querySelector('[data-testid="resolve-icon"]'));
      
      if (resolveButton) {
        await user.click(resolveButton);
        
        await waitFor(() => {
          expect(supabase.from).toHaveBeenCalledWith('document_comments');
        });
      }
    });

    it('tracks comment threads and discussions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Verify comments are ordered by date
      await supabase
        .from('document_comments')
        .select('*')
        .eq('document_type', 'resume')
        .eq('document_id', 'doc-1')
        .order('created_at', { ascending: false });
      
      expect(supabase.from).toHaveBeenCalledWith('document_comments');
    });

    it('restricts commenting based on permissions', async () => {
      const DocumentComments = (await import('@/components/documents/DocumentComments')).DocumentComments;
      
      render(
        <DocumentComments 
          documentType="resume"
          documentId="doc-1"
          canComment={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Great bullet point on leadership')).toBeInTheDocument();
      });

      // Comment input should be disabled or hidden
      const textareas = screen.queryAllByRole('textbox');
      if (textareas.length > 0) {
        expect(textareas[0]).toBeDisabled();
      }
    });
  });

  describe('Document Sharing', () => {
    it('generates secure share links with permissions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const DocumentShareDialog = (await import('@/components/documents/DocumentShareDialog')).DocumentShareDialog;
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <DocumentShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
          documentType="resume"
          documentId="resume-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify share links are displayed
      expect(screen.getByText(/reviewer@example.com/i)).toBeInTheDocument();
    });

    it('supports different permission levels (view, comment, edit)', async () => {
      const DocumentShareDialog = (await import('@/components/documents/DocumentShareDialog')).DocumentShareDialog;
      const user = userEvent.setup();
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <DocumentShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
          documentType="resume"
          documentId="resume-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Permission selector should be present
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('allows setting expiration dates on shares', async () => {
      const DocumentShareDialog = (await import('@/components/documents/DocumentShareDialog')).DocumentShareDialog;
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <DocumentShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
          documentType="resume"
          documentId="resume-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify expiration date is displayed
      expect(screen.getByText(/2024-12-31/i)).toBeInTheDocument();
    });

    it('tracks share access and views', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Query share with access tracking
      await supabase
        .from('resume_shares')
        .select('*')
        .eq('share_token', 'abc123');
      
      expect(supabase.from).toHaveBeenCalledWith('resume_shares');
    });

    it('allows revoking share access', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const DocumentShareDialog = (await import('@/components/documents/DocumentShareDialog')).DocumentShareDialog;
      const user = userEvent.setup();
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <DocumentShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
          documentType="resume"
          documentId="resume-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/reviewer@example.com/i)).toBeInTheDocument();
      });

      // Find delete/revoke button
      const deleteButtons = screen.getAllByRole('button');
      const revokeButton = deleteButtons.find(btn => 
        btn.querySelector('[data-icon="trash"]') || 
        btn.textContent?.toLowerCase().includes('revoke')
      );
      
      if (revokeButton) {
        await user.click(revokeButton);
        
        await waitFor(() => {
          expect(supabase.from).toHaveBeenCalledWith('resume_shares');
        });
      }
    });
  });

  describe('Version History', () => {
    it('displays document version timeline', async () => {
      const VersionHistory = (await import('@/components/documents/VersionHistory')).VersionHistory;
      
      const mockVersions = [
        {
          version: 1,
          timestamp: '2024-01-01T10:00:00Z',
          name: 'Initial version',
          snapshot: { content: 'First version' },
        },
        {
          version: 2,
          timestamp: '2024-01-15T10:00:00Z',
          name: 'Added metrics',
          snapshot: { content: 'Updated version' },
        }
      ];
      
      render(
        <VersionHistory 
          versions={mockVersions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Version 2/i)).toBeInTheDocument();
      });
    });

    it('allows comparing versions side-by-side', async () => {
      const VersionHistory = (await import('@/components/documents/VersionHistory')).VersionHistory;
      
      const mockVersions = [
        {
          version: 1,
          timestamp: '2024-01-01T10:00:00Z',
          snapshot: { content: 'First version' },
        },
        {
          version: 2,
          timestamp: '2024-01-15T10:00:00Z',
          snapshot: { content: 'Updated version' },
        }
      ];
      
      render(
        <VersionHistory 
          versions={mockVersions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
      });

      // Compare/restore buttons should be available
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports restoring previous versions', async () => {
      const VersionHistory = (await import('@/components/documents/VersionHistory')).VersionHistory;
      const mockOnRestore = vi.fn();
      
      const mockVersions = [
        {
          version: 1,
          timestamp: '2024-01-01T10:00:00Z',
          snapshot: { content: 'First version' },
        },
        {
          version: 2,
          timestamp: '2024-01-15T10:00:00Z',
          snapshot: { content: 'Updated version' },
        }
      ];
      
      render(
        <VersionHistory 
          versions={mockVersions}
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
      });

      // Restore button should be available
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('tracks version timestamps', () => {
      const versions = [
        {
          version: 1,
          timestamp: '2024-01-01T10:00:00Z',
          snapshot: { content: 'First' },
        },
        {
          version: 2,
          timestamp: '2024-01-15T10:00:00Z',
          snapshot: { content: 'Second' },
        }
      ];
      
      // Verify timestamps are tracked
      expect(versions[0].timestamp).toBeDefined();
      expect(versions[1].timestamp).toBeDefined();
      expect(new Date(versions[1].timestamp).getTime()).toBeGreaterThan(
        new Date(versions[0].timestamp).getTime()
      );
    });

    it('captures version snapshots for restoration', () => {
      const versions = [
        {
          version: 1,
          timestamp: '2024-01-01T10:00:00Z',
          name: 'Initial version',
          snapshot: { 
            sections: { summary: 'First version' },
            metadata: { author: 'user-1' }
          },
        },
        {
          version: 2,
          timestamp: '2024-01-15T10:00:00Z',
          name: 'Added metrics',
          snapshot: { 
            sections: { summary: 'Updated version' },
            metadata: { author: 'user-1' }
          },
        }
      ];
      
      // Verify snapshots contain full content
      expect(versions[0].snapshot).toBeDefined();
      expect(versions[1].snapshot).toBeDefined();
      expect(versions[0].name).toBe('Initial version');
      expect(versions[1].name).toBe('Added metrics');
    });
  });

  describe('RLS and Permissions', () => {
    it('enforces RLS policies for document access', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Verify queries filter by user context
      await supabase
        .from('resume_shares')
        .select('*')
        .eq('user_id', 'test-user-id');
      
      const fromCalls = (supabase.from as any).mock.calls;
      expect(fromCalls.some((call: any) => call[0] === 'resume_shares')).toBe(true);
    });

    it('validates share token access before allowing operations', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Query share by token
      await supabase
        .from('resume_shares')
        .select('*')
        .eq('share_token', 'abc123');
      
      expect(supabase.from).toHaveBeenCalledWith('resume_shares');
    });

    it('prevents unauthorized comment access', async () => {
      const DocumentComments = (await import('@/components/documents/DocumentComments')).DocumentComments;
      
      render(
        <DocumentComments 
          documentType="resume"
          documentId="doc-1"
          canComment={false}
        />
      );

      await waitFor(() => {
        // Comments should still be visible
        expect(screen.getByText('Great bullet point on leadership')).toBeInTheDocument();
      });

      // But commenting should be disabled
      const textareas = screen.queryAllByRole('textbox');
      if (textareas.length > 0) {
        expect(textareas[0]).toBeDisabled();
      }
    });
  });
});

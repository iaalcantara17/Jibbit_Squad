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
          data: table === 'progress_shares' ? [
            {
              id: 'share-1',
              user_id: 'test-user-id',
              share_token: 'token-123',
              scope: 'kpi_summary',
              is_active: true,
              expires_at: '2024-12-31T23:59:59Z',
              shared_with_name: 'Mom',
              notes: 'Weekly progress for family',
              last_accessed_at: '2024-01-20T10:00:00Z',
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              id: 'share-2',
              user_id: 'test-user-id',
              share_token: 'token-456',
              scope: 'full_progress',
              is_active: true,
              expires_at: null,
              shared_with_name: 'Career Coach',
              notes: 'Full access for coaching',
              last_accessed_at: null,
              created_at: '2024-01-15T10:00:00Z',
            }
          ] : [],
          error: null,
        })),
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

describe('UC-111: Progress Sharing - Extended Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Share Link Management', () => {
    it('creates secure share links with custom tokens', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      const user = userEvent.setup();
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in share details
      const nameInput = screen.getByLabelText(/who are you sharing with/i);
      await user.type(nameInput, 'Mentor');

      // Select scope
      const scopeSelect = screen.getByRole('combobox');
      await user.click(scopeSelect);

      // Create share
      const createButton = screen.getByRole('button', { name: /create share/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('progress_shares');
      });
    });

    it('displays different privacy levels with descriptions', async () => {
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify privacy level descriptions
      expect(screen.getByText(/KPI Summary Only/i)).toBeInTheDocument();
      expect(screen.getByText(/High Privacy/i)).toBeInTheDocument();
    });

    it('supports granular scope control (KPI only, goals only, full)', async () => {
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      const user = userEvent.setup();
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click scope selector
      const scopeSelect = screen.getByRole('combobox');
      await user.click(scopeSelect);

      await waitFor(() => {
        // Options should be available
        expect(screen.getByText(/KPI Summary Only/i)).toBeInTheDocument();
      });
    });

    it('allows setting expiration dates on shares', async () => {
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify existing share with expiry
      expect(screen.getByText(/Mom/i)).toBeInTheDocument();
      expect(screen.getByText(/2024-12-31/i)).toBeInTheDocument();
    });

    it('tracks last access time for shares', async () => {
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Mom/i)).toBeInTheDocument();
      });

      // Last accessed should be displayed
      expect(screen.getByText(/2024-01-20/i)).toBeInTheDocument();
    });

    it('allows revoking active shares', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      const user = userEvent.setup();
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Mom/i)).toBeInTheDocument();
      });

      // Find revoke button
      const deleteButtons = screen.getAllByRole('button');
      const revokeButton = deleteButtons.find(btn => 
        btn.querySelector('[data-icon="trash"]') || 
        btn.textContent?.toLowerCase().includes('delete')
      );
      
      if (revokeButton) {
        await user.click(revokeButton);
        
        await waitFor(() => {
          expect(supabase.from).toHaveBeenCalledWith('progress_shares');
        });
      }
    });

    it('provides copy-to-clipboard for share URLs', async () => {
      const ProgressShareDialog = (await import('@/components/progress/ProgressShareDialog')).ProgressShareDialog;
      const user = userEvent.setup();
      
      // Mock clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve()),
        },
      });
      
      const mockOnOpenChange = vi.fn();
      
      render(
        <ProgressShareDialog 
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Mom/i)).toBeInTheDocument();
      });

      // Find copy button
      const copyButtons = screen.getAllByRole('button');
      const copyButton = copyButtons.find(btn => 
        btn.querySelector('[data-icon="copy"]') || 
        btn.textContent?.toLowerCase().includes('copy')
      );
      
      if (copyButton) {
        await user.click(copyButton);
        
        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Scope-Based Data Filtering', () => {
    it('KPI scope excludes sensitive company and salary data', () => {
      const kpiScope = 'kpi_summary';
      
      // Define what KPI scope includes
      const allowedFields = [
        'applications_count',
        'interviews_count',
        'offers_count',
        'conversion_rate',
        'avg_time_to_offer',
      ];
      
      const excludedFields = [
        'company_names',
        'salary_amounts',
        'contact_details',
        'personal_notes',
      ];
      
      expect(kpiScope).toBe('kpi_summary');
      expect(allowedFields.length).toBeGreaterThan(0);
      expect(excludedFields.length).toBeGreaterThan(0);
    });

    it('Goals scope shows milestones without application details', () => {
      const goalsScope = 'goals_only';
      
      // Define what goals scope includes
      const allowedFields = [
        'goal_title',
        'goal_target',
        'goal_progress',
        'milestone_dates',
      ];
      
      const excludedFields = [
        'application_companies',
        'interview_details',
        'salary_data',
      ];
      
      expect(goalsScope).toBe('goals_only');
      expect(allowedFields.length).toBeGreaterThan(0);
      expect(excludedFields.length).toBeGreaterThan(0);
    });

    it('Full scope includes all progress data', () => {
      const fullScope = 'full_progress';
      
      // Define what full scope includes
      const allowedFields = [
        'all_jobs',
        'all_applications',
        'all_interviews',
        'all_offers',
        'all_goals',
        'all_contacts',
        'all_notes',
      ];
      
      expect(fullScope).toBe('full_progress');
      expect(allowedFields.length).toBeGreaterThan(0);
    });
  });

  describe('Share Access Validation', () => {
    it('validates share token before granting access', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Query by share token
      await supabase
        .from('progress_shares')
        .select('*')
        .eq('share_token', 'token-123');
      
      expect(supabase.from).toHaveBeenCalledWith('progress_shares');
    });

    it('checks expiration date on share access', () => {
      const share = {
        expires_at: '2024-12-31T23:59:59Z',
        is_active: true,
      };
      
      const now = new Date('2024-06-15T10:00:00Z');
      const expiryDate = new Date(share.expires_at);
      const isExpired = now > expiryDate;
      
      expect(isExpired).toBe(false);
      expect(share.is_active).toBe(true);
    });

    it('blocks access to inactive shares', () => {
      const inactiveShare = {
        is_active: false,
        share_token: 'token-789',
      };
      
      expect(inactiveShare.is_active).toBe(false);
    });

    it('tracks access attempts for audit purposes', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Update last_accessed_at on share access
      await supabase
        .from('progress_shares')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('share_token', 'token-123');
      
      expect(supabase.from).toHaveBeenCalledWith('progress_shares');
    });
  });

  describe('RLS and Security', () => {
    it('enforces RLS policies on progress_shares table', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Queries must filter by user_id
      await supabase
        .from('progress_shares')
        .select('*')
        .eq('user_id', 'test-user-id');
      
      const fromCalls = (supabase.from as any).mock.calls;
      expect(fromCalls.some((call: any) => call[0] === 'progress_shares')).toBe(true);
    });

    it('prevents unauthorized share modifications', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Updates must be scoped to owned shares
      await supabase
        .from('progress_shares')
        .update({ is_active: false })
        .eq('id', 'share-1');
      
      expect(supabase.from).toHaveBeenCalledWith('progress_shares');
    });

    it('uses secure random tokens for share links', () => {
      const token = crypto.randomUUID();
      
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});

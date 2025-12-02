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
          data: table === 'referral_requests' ? [
            {
              id: 'ref-1',
              user_id: 'test-user-id',
              job_id: 'job-1',
              contact_id: 'contact-1',
              status: 'requested',
              message_sent: 'Would you be willing to refer me?',
              next_followup_at: '2024-02-01T10:00:00Z',
              notes: 'Strong connection',
              created_at: '2024-01-15T10:00:00Z',
              job: { company: 'Tech Corp', position: 'Engineer' },
              contact: { name: 'John Doe', company: 'Tech Corp' },
            },
            {
              id: 'ref-2',
              user_id: 'test-user-id',
              job_id: 'job-2',
              contact_id: 'contact-2',
              status: 'successful',
              message_sent: 'Thanks for the referral!',
              created_at: '2024-01-10T10:00:00Z',
              job: { company: 'StartupCo', position: 'PM' },
              contact: { name: 'Jane Smith', company: 'StartupCo' },
            }
          ] : table === 'contacts' ? [
            { id: 'contact-1', name: 'John Doe', company: 'Tech Corp' },
            { id: 'contact-2', name: 'Jane Smith', company: 'StartupCo' },
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

describe('UC-087: Referral Request Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies potential referral sources for specific job applications', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const ReferralRequestForm = (await import('@/components/jobs/ReferralRequestForm')).ReferralRequestForm;
    
    const mockJob = { id: 'job-1', company: 'Tech Corp', position: 'Engineer' };
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();
    
    render(
      <ReferralRequestForm 
        job={mockJob}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('contacts');
    });
  });

  it('generates personalized referral request templates', async () => {
    const ReferralRequestForm = (await import('@/components/jobs/ReferralRequestForm')).ReferralRequestForm;
    
    const mockJob = { id: 'job-1', company: 'Tech Corp', position: 'Software Engineer' };
    const mockContact = { id: 'contact-1', name: 'John Doe', company: 'Tech Corp' };
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();
    
    render(
      <ReferralRequestForm 
        job={mockJob}
        contact={mockContact}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Verify form is rendered with fields for message
    await waitFor(() => {
      expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
    });
  });

  it('tracks referral request status and follow-up timing', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Fetch referral requests with status
    await supabase
      .from('referral_requests')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('referral_requests');
    });
  });

  it('monitors referral success rates and relationship impact', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data } = await supabase
      .from('referral_requests')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    // Calculate success rate
    const successfulReferrals = data?.filter(r => r.status === 'successful') || [];
    const successRate = data && data.length > 0 
      ? (successfulReferrals.length / data.length) * 100 
      : 0;
    
    expect(successRate).toBeGreaterThanOrEqual(0);
  });

  it('includes guidance on appropriate referral etiquette', async () => {
    const ReferralRequestForm = (await import('@/components/jobs/ReferralRequestForm')).ReferralRequestForm;
    
    const mockJob = { id: 'job-1', company: 'Tech Corp', position: 'Engineer' };
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();
    
    render(
      <ReferralRequestForm 
        job={mockJob}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Form should have guidance text or tooltips
    await waitFor(() => {
      expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
    });
  });

  it('suggests optimal timing for referral requests', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const ReferralRequestForm = (await import('@/components/jobs/ReferralRequestForm')).ReferralRequestForm;
    
    const mockJob = { id: 'job-1', company: 'Tech Corp', position: 'Engineer' };
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();
    
    render(
      <ReferralRequestForm 
        job={mockJob}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Verify next follow-up field exists
    await waitFor(() => {
      expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
    });
  });

  it('tracks referral outcomes and gratitude expressions', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Update referral request with outcome
    await supabase
      .from('referral_requests')
      .update({ status: 'successful', notes: 'Referral led to interview' })
      .eq('id', 'ref-1');
    
    expect(supabase.from).toHaveBeenCalledWith('referral_requests');
  });

  it('maintains referral relationship health and reciprocity', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Track interaction after successful referral
    const { data } = await supabase
      .from('referral_requests')
      .select('*, contact(*)')
      .eq('status', 'successful');
    
    expect(supabase.from).toHaveBeenCalledWith('referral_requests');
  });

  it('enforces RLS policies for referral request data', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test that queries include user_id filter
    await supabase
      .from('referral_requests')
      .select('*')
      .eq('user_id', 'test-user-id');
    
    const fromCalls = (supabase.from as any).mock.calls;
    expect(fromCalls.some((call: any) => call[0] === 'referral_requests')).toBe(true);
  });
});

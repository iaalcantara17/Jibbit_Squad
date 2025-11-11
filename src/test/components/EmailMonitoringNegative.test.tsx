import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmailStatusMonitor } from '@/components/jobs/EmailStatusMonitor';

describe('EmailStatusMonitor - Negative Paths', () => {
  it('handles message with detected status but no job match', async () => {
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        auth: {
          getUser: vi.fn(() => Promise.resolve({ 
            data: { user: { id: 'test-user' } } 
          }))
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [{
                    id: '1',
                    subject: 'Thanks for applying',
                    detected_status: 'Applied',
                    job_id: null,  // No job match
                    confidence: 0.8
                  }]
                }))
              }))
            }))
          }))
        }))
      }
    }));

    render(<EmailStatusMonitor />);
    
    await waitFor(() => {
      // Should show email without job association
      expect(screen.queryByText(/Thanks for applying/i)).toBeTruthy();
    });
  });

  it('handles Gmail 429 rate limit error gracefully', async () => {
    const mockError = { 
      message: 'Rate limit exceeded',
      code: 429 
    };

    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        auth: {
          getUser: vi.fn(() => Promise.resolve({ 
            data: { user: { id: 'test-user' } } 
          }))
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: null,
                  error: mockError
                }))
              }))
            }))
          }))
        })),
        functions: {
          invoke: vi.fn(() => Promise.resolve({
            data: null,
            error: mockError
          }))
        }
      }
    }));

    render(<EmailStatusMonitor />);
    
    await waitFor(() => {
      // Should show error state
      expect(screen.queryByText(/error/i) || screen.queryByText(/rate limit/i)).toBeTruthy();
    });
  });
});

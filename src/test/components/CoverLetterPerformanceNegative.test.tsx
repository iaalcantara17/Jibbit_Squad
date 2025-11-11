import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CoverLetterPerformanceTrackerExtended } from '@/components/cover-letters/CoverLetterPerformanceTrackerExtended';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } } 
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: []  // No data for comparison
        }))
      }))
    }))
  }
}));

describe('CoverLetterPerformanceTracker - Negative Paths', () => {
  it('shows no data message when template has no submissions', async () => {
    render(<CoverLetterPerformanceTrackerExtended />);
    
    await waitFor(() => {
      // Should show empty state or "no data" indicator
      expect(
        screen.queryByText(/no data/i) || 
        screen.queryByText(/no submissions/i) ||
        screen.queryByText(/0%/i)
      ).toBeTruthy();
    });
  });

  it('handles A/B comparison with one template having zero data', async () => {
    const mockData = [
      {
        template_id: 'template-1',
        sent_count: 10,
        response_count: 5,
        response_rate: 50
      },
      {
        template_id: 'template-2',
        sent_count: 0,
        response_count: 0,
        response_rate: 0
      }
    ];

    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: mockData
        }))
      }))
    });

    render(<CoverLetterPerformanceTrackerExtended />);
    
    await waitFor(() => {
      // Should handle zero division gracefully
      expect(screen.queryByText(/0%/i) || screen.queryByText(/no data/i)).toBeTruthy();
    });
  });
});

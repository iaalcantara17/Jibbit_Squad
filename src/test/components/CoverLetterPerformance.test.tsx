import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CoverLetterPerformanceTracker } from '@/components/cover-letters/CoverLetterPerformanceTracker';

vi.mock('@/lib/api', () => ({
  api: {
    coverLetters: {
      getPerformanceStats: vi.fn().mockResolvedValue({
        totalSent: 50,
        responseRate: 65,
        avgResponseTime: 7,
        topPerformingTemplate: 'formal'
      })
    }
  }
}));

describe('CoverLetterPerformanceTracker', () => {
  it('renders performance metrics', async () => {
    const { getByText } = render(<CoverLetterPerformanceTracker />);
    
    expect(getByText('Cover Letter Performance')).toBeTruthy();
  });

  it('displays performance statistics sections', () => {
    const { getByText } = render(<CoverLetterPerformanceTracker />);
    
    // Should have sections for different metrics
    expect(getByText(/Performance/)).toBeTruthy();
  });
});
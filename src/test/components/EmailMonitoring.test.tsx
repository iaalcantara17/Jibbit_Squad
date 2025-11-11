import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EmailStatusMonitor } from '@/components/jobs/EmailStatusMonitor';

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
              data: []
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('EmailStatusMonitor', () => {
  it('renders email monitoring interface', () => {
    const { container } = render(<EmailStatusMonitor />);
    expect(container).toBeTruthy();
  });

  it('displays empty state when no emails tracked', () => {
    const { container } = render(<EmailStatusMonitor />);
    expect(container.textContent).toContain('No email tracking data yet');
  });
});

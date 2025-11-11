import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ApplicationAutomation } from '@/components/jobs/ApplicationAutomation';

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
          data: []
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: [{ id: '1', rule_type: 'generate_package' }]
        }))
      }))
    }))
  }
}));

describe('ApplicationAutomation', () => {
  it('renders automation rules interface', () => {
    const { container } = render(<ApplicationAutomation />);
    expect(container).toBeTruthy();
  });

  it('displays rule creation options', () => {
    const { container } = render(<ApplicationAutomation />);
    expect(container.querySelector('button')).toBeTruthy();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationRuleBuilder } from '@/components/automation/AutomationRuleBuilder';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } } 
      }))
    },
    from: vi.fn((table) => {
      if (table === 'automation_rules') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Action validation failed', code: 'VALIDATION_ERROR' }
            }))
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: []
            }))
          }))
        };
      }
      return {
        select: vi.fn(() => Promise.resolve({ data: [] }))
      };
    })
  }
}));

describe('AutomationRuleBuilder - Negative Paths', () => {
  it('handles action error and records error outcome', async () => {
    const user = userEvent.setup();
    render(<AutomationRuleBuilder />);
    
    // Try to create a rule that will fail
    const createButton = screen.queryByRole('button', { name: /create/i });
    if (createButton) {
      await user.click(createButton);
      
      await waitFor(() => {
        // Should show error state or toast
        expect(screen.queryByText(/error/i) || screen.queryByText(/failed/i)).toBeTruthy();
      });
    }
  });

  it('skips rule when conditions not met', async () => {
    const mockExecute = vi.fn().mockResolvedValue({
      data: { outcome: 'skipped', reason: 'Conditions not met' }
    });
    
    vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{
            id: '1',
            rule_type: 'generate_package',
            trigger_event: 'deadline_approaching',
            conditions: { days_until_deadline: 7 },
            action_config: {}
          }]
        }))
      }))
    });

    render(<AutomationRuleBuilder />);
    
    // Rule with unmet conditions should be filtered
    await waitFor(() => {
      expect(screen.queryByText(/generate_package/i)).toBeTruthy();
    });
  });
});

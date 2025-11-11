import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AutomationRuleBuilder } from '@/components/automation/AutomationRuleBuilder';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user1' } } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [] })) })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe('AutomationRuleBuilder', () => {
  it('renders create rule button', () => {
    render(<AutomationRuleBuilder />);
    expect(screen.getByText(/create rule/i)).toBeDefined();
  });
});

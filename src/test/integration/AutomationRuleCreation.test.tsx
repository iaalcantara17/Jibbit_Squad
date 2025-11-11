import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationRuleBuilder } from '@/components/automation/AutomationRuleBuilder';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Automation Rule Creation Integration', () => {
  const mockUser = { id: 'test-user-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should create a rule with all required fields and show success', async () => {
    const user = userEvent.setup();
    
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'automation_rules') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return { select: vi.fn(), insert: vi.fn() };
    });

    render(<AutomationRuleBuilder />);

    // Click create rule button
    const createButton = screen.getByRole('button', { name: /create rule/i });
    await user.click(createButton);

    // Fill in required fields
    const nameInput = screen.getByLabelText(/rule name/i);
    await user.type(nameInput, 'Deadline Reminder Rule');

    // Select trigger type
    const triggerSelect = screen.getByLabelText(/trigger type/i);
    await user.click(triggerSelect);
    await user.click(screen.getByRole('option', { name: /deadline reminder/i }));

    // Set days before deadline
    const daysInput = screen.getByLabelText(/days before deadline/i);
    await user.clear(daysInput);
    await user.type(daysInput, '3');

    // Select action type
    const actionSelect = screen.getByLabelText(/action type/i);
    await user.click(actionSelect);
    await user.click(screen.getByRole('option', { name: /send email/i }));

    // Fill email fields
    const subjectInput = screen.getByLabelText(/email subject/i);
    await user.type(subjectInput, 'Application Deadline Approaching');

    const bodyInput = screen.getByLabelText(/email body/i);
    await user.type(bodyInput, 'Your application deadline is in 3 days');

    // Save rule
    const saveButton = screen.getByRole('button', { name: /save rule/i });
    await user.click(saveButton);

    // Verify insert was called with correct data
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Deadline Reminder Rule',
        is_enabled: true,
        trigger: { type: 'deadline', days_before: 3 },
        action: {
          type: 'send_email',
          subject: 'Application Deadline Approaching',
          body: 'Your application deadline is in 3 days',
        },
        user_id: mockUser.id,
        rule_type: 'deadline',
      });
    });
  });

  it('should show validation error for missing required fields', async () => {
    const user = userEvent.setup();
    
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
      insert: vi.fn(),
    }));

    render(<AutomationRuleBuilder />);

    // Click create rule
    const createButton = screen.getByRole('button', { name: /create rule/i });
    await user.click(createButton);

    // Try to save without filling fields
    const saveButton = screen.getByRole('button', { name: /save rule/i });
    await user.click(saveButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  it('should show rule in list after successful creation', async () => {
    const user = userEvent.setup();
    
    const createdRule = {
      id: 'rule-123',
      name: 'Test Rule',
      is_enabled: true,
      trigger: { type: 'deadline', days_before: 3 },
      action: { type: 'send_email', subject: 'Test', body: 'Test body' },
      user_id: mockUser.id,
      rule_type: 'deadline',
    };

    const mockInsert = vi.fn().mockResolvedValue({ data: createdRule, error: null });
    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        order: vi.fn().mockResolvedValue({ data: [createdRule], error: null }),
      });

    (supabase.from as any).mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert,
    }));

    render(<AutomationRuleBuilder />);

    // Create rule
    const createButton = screen.getByRole('button', { name: /create rule/i });
    await user.click(createButton);

    const nameInput = screen.getByLabelText(/rule name/i);
    await user.type(nameInput, 'Test Rule');

    const saveButton = screen.getByRole('button', { name: /save rule/i });
    await user.click(saveButton);

    // Should reload and show the rule
    await waitFor(() => {
      expect(screen.getByText('Test Rule')).toBeInTheDocument();
    });
  });
});

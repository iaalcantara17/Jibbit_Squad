import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationAutomation } from '@/components/jobs/ApplicationAutomation';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ApplicationAutomation', () => {
  it('should render automation options', () => {
    const { getByText } = render(<ApplicationAutomation />);
    
    expect(getByText('Follow-up Reminders')).toBeTruthy();
    expect(getByText('Deadline Reminders')).toBeTruthy();
    expect(getByText('Auto Status Updates')).toBeTruthy();
  });

  it('should display checklist items', () => {
    const { getByText } = render(<ApplicationAutomation />);
    
    expect(getByText('Resume tailored for position')).toBeTruthy();
    expect(getByText('Cover letter customized')).toBeTruthy();
    expect(getByText('Company research completed')).toBeTruthy();
  });
});

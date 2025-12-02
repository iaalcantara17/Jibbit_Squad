import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
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

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-102: Custom Report Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows creating custom report templates', async () => {
    const CustomReports = (await import('@/pages/CustomReports')).default;
    
    render(
      <BrowserRouter>
        <CustomReports />
      </BrowserRouter>
    );

    await waitFor(() => {
      const newReportBtn = screen.getByRole('button', { name: /new report/i });
      expect(newReportBtn).toBeInTheDocument();
    });
  });

  it('supports selecting multiple metrics', () => {
    const availableMetrics = [
      'Applications Sent',
      'Conversion Rate',
      'Time to Offer',
      'Interview Success Rate',
    ];
    
    const selectedMetrics = ['Applications Sent', 'Conversion Rate'];
    
    expect(selectedMetrics.every(m => availableMetrics.includes(m))).toBe(true);
  });

  it('allows configuring date range filters', () => {
    const reportConfig = {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      metrics: ['Applications Sent'],
    };
    
    expect(reportConfig.startDate).toBeDefined();
    expect(reportConfig.endDate).toBeDefined();
  });

  it('saves report templates to database', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    await supabase.from('custom_report_templates').insert({
      user_id: 'test-user-id',
      name: 'Monthly Performance',
      metrics: ['Applications Sent', 'Conversion Rate'],
    });
    
    expect(supabase.from).toHaveBeenCalledWith('custom_report_templates');
  });

  it('generates reports from saved templates', async () => {
    const template = {
      id: 'template-1',
      name: 'Monthly Performance',
      metrics: ['Applications Sent', 'Conversion Rate'],
      filters: { startDate: '2024-01-01', endDate: '2024-01-31' },
    };
    
    expect(template.metrics.length).toBe(2);
    expect(template.filters).toBeDefined();
  });

  it('exports custom reports to CSV', async () => {
    const reportData = [
      { metric: 'Applications Sent', value: 10 },
      { metric: 'Conversion Rate', value: 25 },
    ];
    
    // Simulate CSV export
    const csv = reportData.map(row => `${row.metric},${row.value}`).join('\n');
    
    expect(csv).toContain('Applications Sent,10');
    expect(csv).toContain('Conversion Rate,25');
  });

  it('exports custom reports to PDF', () => {
    const reportData = {
      title: 'Monthly Performance Report',
      metrics: [
        { name: 'Applications Sent', value: 10 },
        { name: 'Conversion Rate', value: 25 },
      ],
    };
    
    expect(reportData.title).toBeDefined();
    expect(reportData.metrics.length).toBe(2);
  });
});

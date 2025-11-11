import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Analytics from '@/pages/Analytics';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    jobs: {
      getStats: vi.fn().mockResolvedValue({
        total: 10,
        byStatus: {
          interested: 2,
          applied: 4,
          phoneScreen: 2,
          interview: 1,
          offer: 1,
          rejected: 0
        },
        upcomingDeadlines: []
      }),
      getAll: vi.fn().mockResolvedValue([])
    }
  }
}));

// Mock export hook
vi.mock('@/hooks/useExport', () => ({
  useExport: () => ({
    exportJobsToCSV: vi.fn()
  })
}));

// Mock Navigation
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div>Navigation</div>
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  Pie: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Cell: () => <div />
}));

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics page', async () => {
    const { getByText } = render(<Analytics />);
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(getByText('Job Search Analytics')).toBeTruthy();
  });

  it('displays key metrics cards', async () => {
    const { getByText } = render(<Analytics />);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(getByText('Total Jobs')).toBeTruthy();
    expect(getByText('Response Rate')).toBeTruthy();
    expect(getByText('Deadline Adherence')).toBeTruthy();
    expect(getByText('Time to Offer')).toBeTruthy();
  });

  it('renders export button', async () => {
    const { getByText } = render(<Analytics />);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(getByText('Export CSV')).toBeTruthy();
  });
});
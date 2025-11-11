import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobAnalyticsDashboard } from '@/components/analytics/JobAnalyticsDashboard';

vi.mock('@/lib/api', () => ({
  api: { jobs: { getAll: vi.fn(() => Promise.resolve([])) } },
}));

describe('JobAnalyticsDashboard', () => {
  it('renders analytics dashboard', async () => {
    render(<JobAnalyticsDashboard />);
    await waitFor(() => expect(screen.getByText(/total/i)).toBeDefined());
  });
});

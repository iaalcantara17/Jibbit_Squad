import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { JobCard } from '@/components/jobs/JobCard';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    job_id: '1',
    user_id: 'user1',
    jobTitle: 'Software Engineer',
    company: { name: 'Tech Corp' },
    location: 'San Francisco, CA',
    status: 'Applied' as const,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('should render job title and company', () => {
    const { container } = render(<JobCard job={mockJob} onDelete={vi.fn()} onArchive={vi.fn()} />);
    expect(container.textContent).toContain('Software Engineer');
    expect(container.textContent).toContain('Tech Corp');
  });

  it('should display job location', () => {
    const { container } = render(<JobCard job={mockJob} onDelete={vi.fn()} onArchive={vi.fn()} />);
    expect(container.textContent).toContain('San Francisco, CA');
  });

  it('should show status badge', () => {
    const { container } = render(<JobCard job={mockJob} onDelete={vi.fn()} onArchive={vi.fn()} />);
    expect(container.textContent).toContain('Applied');
  });
});

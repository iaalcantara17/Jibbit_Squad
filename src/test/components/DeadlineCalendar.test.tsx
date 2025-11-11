import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DeadlineCalendar } from '@/components/jobs/DeadlineCalendar';
import { Job } from '@/types/jobs';
import { addDays, subDays } from 'date-fns';

describe('DeadlineCalendar', () => {
  const mockJobs: Job[] = [
    {
      id: '1',
      job_title: 'Software Engineer',
      company_name: 'Tech Corp',
      status: 'Applied',
      location: 'Remote',
      applicationDeadline: addDays(new Date(), 1).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    } as Job,
    {
      id: '2',
      job_title: 'Product Manager',
      company_name: 'StartupXYZ',
      status: 'Interested',
      location: 'NYC',
      applicationDeadline: addDays(new Date(), 5).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    } as Job,
    {
      id: '3',
      job_title: 'Designer',
      company_name: 'Creative Agency',
      status: 'Interview',
      location: 'SF',
      applicationDeadline: subDays(new Date(), 1).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    } as Job,
  ];

  it('renders calendar component', () => {
    const { getByText } = render(<DeadlineCalendar jobs={mockJobs} />);
    expect(getByText('Application Deadlines')).toBeInTheDocument();
  });

  it('renders upcoming deadlines section', () => {
    const { getByText } = render(<DeadlineCalendar jobs={mockJobs} />);
    expect(getByText('Upcoming Deadlines (Next 7 Days)')).toBeInTheDocument();
  });

  it('displays jobs with upcoming deadlines', () => {
    const { getByText } = render(<DeadlineCalendar jobs={mockJobs} />);
    
    // Should show jobs due within 7 days
    expect(getByText('Software Engineer')).toBeInTheDocument();
    expect(getByText('Product Manager')).toBeInTheDocument();
  });

  it('shows urgency badges for deadlines', () => {
    const { getByText } = render(<DeadlineCalendar jobs={mockJobs} />);
    
    // Should show urgency indicators
    expect(getByText('Tomorrow')).toBeInTheDocument();
  });

  it('displays empty state when no upcoming deadlines', () => {
    const noDeadlineJobs: Job[] = [
      {
        id: '1',
        job_title: 'Software Engineer',
        company_name: 'Tech Corp',
        status: 'Applied',
        location: 'Remote',
        created_at: new Date().toISOString(),
      } as Job,
    ];

    const { getByText } = render(<DeadlineCalendar jobs={noDeadlineJobs} />);
    expect(getByText(/no upcoming deadlines/i)).toBeInTheDocument();
  });

  it('displays urgency legend', () => {
    const { getByText } = render(<DeadlineCalendar jobs={mockJobs} />);
    
    expect(getByText('Urgency Levels:')).toBeInTheDocument();
    expect(getByText('Overdue')).toBeInTheDocument();
    expect(getByText(/Urgent/)).toBeInTheDocument();
  });
});

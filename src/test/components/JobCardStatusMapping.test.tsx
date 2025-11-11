import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from '@/components/jobs/JobCard';
import { Job, JobStatus } from '@/types/jobs';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('JobCard - Status Display Mapping', () => {
  const baseJob: Job = {
    id: '1',
    job_id: '1',
    user_id: 'user-123',
    jobTitle: 'Software Engineer',
    company: {
      name: 'Tech Corp',
    },
    status: 'Applied',
    location: 'San Francisco, CA',
    jobDescription: 'Great job',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isArchived: false,
  };

  it('displays "Interested" for DB status "interested"', () => {
    const job = { ...baseJob, status: 'Interested' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Interested')).toBeInTheDocument();
  });

  it('displays "Applied" for DB status "applied"', () => {
    const job = { ...baseJob, status: 'Applied' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('displays "Phone Screen" for DB status "phone_screen"', () => {
    const job = { ...baseJob, status: 'Phone Screen' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Phone Screen')).toBeInTheDocument();
  });

  it('displays "Interview" for DB status "interview"', () => {
    const job = { ...baseJob, status: 'Interview' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Interview')).toBeInTheDocument();
  });

  it('displays "Offer" for DB status "offer"', () => {
    const job = { ...baseJob, status: 'Offer' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Offer')).toBeInTheDocument();
  });

  it('displays "Rejected" for DB status "rejected"', () => {
    const job = { ...baseJob, status: 'Rejected' as JobStatus };
    render(
      <JobCard 
        job={job} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays job title and company', () => {
    render(
      <JobCard 
        job={baseJob} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalJob: Job = {
      id: '1',
      job_id: '1',
      user_id: 'user-123',
      jobTitle: 'Engineer',
      company: { name: 'Company' },
      status: 'Applied' as JobStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    };

    render(
      <JobCard 
        job={minimalJob} 
        onView={vi.fn()} 
        onDelete={vi.fn()} 
        onArchive={vi.fn()} 
      />
    );

    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });
});

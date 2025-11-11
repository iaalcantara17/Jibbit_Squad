import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CompanyInfoSection } from '@/components/jobs/CompanyInfoSection';

describe('CompanyInfoSection', () => {
  const mockCompany = {
    name: 'Tech Corp',
    industry: 'Technology',
    location: 'San Francisco, CA',
    size: '1000-5000',
    website: 'https://techcorp.com',
    description: 'Leading technology company',
    glassdoorRating: 4.5
  };

  it('renders company information correctly', () => {
    const { getByText } = render(<CompanyInfoSection company={mockCompany} />);
    
    expect(getByText('Tech Corp')).toBeTruthy();
    expect(getByText('Technology')).toBeTruthy();
    expect(getByText('San Francisco, CA')).toBeTruthy();
    expect(getByText('1000-5000 employees')).toBeTruthy();
  });

  it('displays Glassdoor rating when available', () => {
    const { getByText } = render(<CompanyInfoSection company={mockCompany} />);
    
    expect(getByText('4.5')).toBeTruthy();
    expect(getByText('/ 5.0')).toBeTruthy();
  });

  it('renders website link', () => {
    const { getByRole } = render(<CompanyInfoSection company={mockCompany} />);
    
    const link = getByRole('link');
    expect(link.getAttribute('href')).toBe('https://techcorp.com');
  });
});
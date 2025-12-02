import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateApplicationsSent,
  calculateInterviewsScheduled,
  calculateOffersReceived,
  calculateConversionRates,
  calculateMedianTimeToResponse,
  filterJobsByDateRange,
  filterJobsByCompany,
  filterJobsByRole,
  filterJobsByIndustry,
  getUniqueCompanies,
  getUniqueRoles,
  getUniqueIndustries,
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getUpcomingDeadlines,
  getMonthlyApplications,
} from '@/lib/analyticsService';

describe('Analytics Service', () => {
  const mockJobs = [
    { id: '1', status: 'Applied', company_name: 'Tech Corp', job_title: 'Engineer', industry: 'Technology', created_at: '2025-01-15', is_archived: false },
    { id: '2', status: 'Interview', company_name: 'Finance Inc', job_title: 'Developer', industry: 'Finance', created_at: '2025-02-10', is_archived: false },
    { id: '3', status: 'Offer', company_name: 'Tech Corp', job_title: 'Engineer', industry: 'Technology', created_at: '2025-03-05', is_archived: false },
    { id: '4', status: 'Rejected', company_name: 'Startup XYZ', job_title: 'Lead', industry: 'Technology', created_at: '2025-03-20', is_archived: false },
    { id: '5', status: 'Interested', company_name: 'Big Co', job_title: 'Manager', industry: 'Finance', created_at: '2025-04-01', is_archived: false },
  ];

  const mockInterviews = [
    { id: '1', scheduled_start: '2025-02-15T10:00:00Z' },
    { id: '2', interview_date: '2025-03-10' },
    { id: '3', scheduled_start: null, interview_date: null },
  ];

  const mockStatusHistory = [
    { job_id: '1', to_status: 'Applied', changed_at: '2025-01-15T10:00:00Z' },
    { job_id: '1', to_status: 'Phone Screen', changed_at: '2025-01-25T10:00:00Z' },
    { job_id: '2', to_status: 'Applied', changed_at: '2025-02-10T10:00:00Z' },
    { job_id: '2', to_status: 'Interview', changed_at: '2025-02-20T10:00:00Z' },
    { job_id: '3', to_status: 'Applied', changed_at: '2025-03-05T10:00:00Z' },
    { job_id: '3', to_status: 'Interview', changed_at: '2025-03-15T10:00:00Z' },
    { job_id: '3', to_status: 'Offer', changed_at: '2025-03-25T10:00:00Z' },
  ];

  describe('calculateApplicationsSent', () => {
    it('should count jobs that have been applied', () => {
      const result = calculateApplicationsSent(mockJobs);
      expect(result).toBe(4); // Applied, Interview, Offer, Rejected
    });

    it('should return 0 for empty array', () => {
      expect(calculateApplicationsSent([])).toBe(0);
    });

    it('should not count Interested status', () => {
      const interestedOnly = [{ status: 'Interested' }];
      expect(calculateApplicationsSent(interestedOnly)).toBe(0);
    });
  });

  describe('calculateInterviewsScheduled', () => {
    it('should count interviews with scheduled_start or interview_date', () => {
      const result = calculateInterviewsScheduled(mockInterviews);
      expect(result).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(calculateInterviewsScheduled([])).toBe(0);
    });
  });

  describe('calculateOffersReceived', () => {
    it('should count jobs with Offer status', () => {
      const result = calculateOffersReceived(mockJobs);
      expect(result).toBe(1);
    });

    it('should use offers array if provided', () => {
      const offers = [{ id: '1' }, { id: '2' }];
      const result = calculateOffersReceived(mockJobs, offers);
      expect(result).toBe(2);
    });

    it('should return 0 for empty array with no offers', () => {
      expect(calculateOffersReceived([])).toBe(0);
    });
  });

  describe('calculateConversionRates', () => {
    it('should calculate correct conversion rates', () => {
      const result = calculateConversionRates(mockJobs);
      
      expect(result).toHaveProperty('appliedToInterview');
      expect(result).toHaveProperty('interviewToOffer');
      expect(result).toHaveProperty('appliedToOffer');
    });

    it('should return 0 rates for empty array', () => {
      const result = calculateConversionRates([]);
      expect(result.appliedToInterview).toBe(0);
      expect(result.interviewToOffer).toBe(0);
      expect(result.appliedToOffer).toBe(0);
    });

    it('should handle jobs with only Applied status', () => {
      const appliedOnly = [{ status: 'Applied' }, { status: 'Applied' }];
      const result = calculateConversionRates(appliedOnly);
      expect(result.appliedToInterview).toBe(0);
    });
  });

  describe('calculateMedianTimeToResponse', () => {
    it('should calculate median response time', () => {
      const result = calculateMedianTimeToResponse(mockJobs, mockStatusHistory);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return null for empty data', () => {
      expect(calculateMedianTimeToResponse([], [])).toBeNull();
    });

    it('should return null when no valid response times', () => {
      const jobs = [{ id: '999' }];
      expect(calculateMedianTimeToResponse(jobs, [])).toBeNull();
    });
  });

  describe('filterJobsByDateRange', () => {
    it('should filter jobs within date range', () => {
      const startDate = new Date('2025-02-01');
      const endDate = new Date('2025-03-31');
      const result = filterJobsByDateRange(mockJobs, startDate, endDate);
      expect(result.length).toBe(3);
    });

    it('should return all jobs when no dates provided', () => {
      const result = filterJobsByDateRange(mockJobs, null, null);
      expect(result.length).toBe(mockJobs.length);
    });

    it('should filter with only start date', () => {
      const startDate = new Date('2025-03-01');
      const result = filterJobsByDateRange(mockJobs, startDate, null);
      expect(result.length).toBe(3);
    });

    it('should filter with only end date', () => {
      const endDate = new Date('2025-02-28');
      const result = filterJobsByDateRange(mockJobs, null, endDate);
      expect(result.length).toBe(2);
    });
  });

  describe('filterJobsByCompany', () => {
    it('should filter jobs by company name', () => {
      const result = filterJobsByCompany(mockJobs, 'Tech');
      expect(result.length).toBe(2);
    });

    it('should return all jobs when no company specified', () => {
      const result = filterJobsByCompany(mockJobs, null);
      expect(result.length).toBe(mockJobs.length);
    });

    it('should be case insensitive', () => {
      const result = filterJobsByCompany(mockJobs, 'TECH');
      expect(result.length).toBe(2);
    });
  });

  describe('filterJobsByRole', () => {
    it('should filter jobs by role', () => {
      const result = filterJobsByRole(mockJobs, 'Engineer');
      expect(result.length).toBe(2);
    });

    it('should return all jobs when no role specified', () => {
      const result = filterJobsByRole(mockJobs, null);
      expect(result.length).toBe(mockJobs.length);
    });
  });

  describe('filterJobsByIndustry', () => {
    it('should filter jobs by industry', () => {
      const result = filterJobsByIndustry(mockJobs, 'Technology');
      expect(result.length).toBe(3);
    });

    it('should return all jobs when no industry specified', () => {
      const result = filterJobsByIndustry(mockJobs, null);
      expect(result.length).toBe(mockJobs.length);
    });
  });

  describe('getUniqueCompanies', () => {
    it('should return unique company names', () => {
      const result = getUniqueCompanies(mockJobs);
      expect(result).toContain('Tech Corp');
      expect(result).toContain('Finance Inc');
      expect(result.length).toBe(4);
    });

    it('should return sorted array', () => {
      const result = getUniqueCompanies(mockJobs);
      const sorted = [...result].sort();
      expect(result).toEqual(sorted);
    });

    it('should handle empty array', () => {
      expect(getUniqueCompanies([])).toEqual([]);
    });
  });

  describe('getUniqueRoles', () => {
    it('should return unique job titles', () => {
      const result = getUniqueRoles(mockJobs);
      expect(result).toContain('Engineer');
      expect(result).toContain('Developer');
    });

    it('should handle empty array', () => {
      expect(getUniqueRoles([])).toEqual([]);
    });
  });

  describe('getUniqueIndustries', () => {
    it('should return unique industries', () => {
      const result = getUniqueIndustries(mockJobs);
      expect(result).toContain('Technology');
      expect(result).toContain('Finance');
    });

    it('should handle empty array', () => {
      expect(getUniqueIndustries([])).toEqual([]);
    });
  });

  describe('calculateAverageTimeInStage', () => {
    it('should calculate average time in each stage', () => {
      const result = calculateAverageTimeInStage(mockJobs, mockStatusHistory);
      expect(typeof result).toBe('object');
    });

    it('should return empty object for empty data', () => {
      const result = calculateAverageTimeInStage([], []);
      expect(result).toEqual({});
    });
  });

  describe('calculateDeadlineAdherence', () => {
    it('should return 100 when no jobs have deadlines', () => {
      const result = calculateDeadlineAdherence(mockJobs, mockStatusHistory);
      expect(result).toBe(100);
    });

    it('should calculate adherence for jobs with deadlines', () => {
      const jobsWithDeadlines = [
        { id: '1', application_deadline: '2025-01-20' },
      ];
      const result = calculateDeadlineAdherence(jobsWithDeadlines, mockStatusHistory);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateTimeToOffer', () => {
    it('should calculate average time to offer', () => {
      const result = calculateTimeToOffer(mockJobs, mockStatusHistory);
      // Job 3 has Offer status and history
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return null when no offers', () => {
      const noOffers = [{ id: '1', status: 'Applied' }];
      const result = calculateTimeToOffer(noOffers, []);
      expect(result).toBeNull();
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return jobs with upcoming deadlines', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const jobsWithDeadlines = [
        { id: '1', job_title: 'Test', company_name: 'Co', application_deadline: futureDate.toISOString(), is_archived: false },
      ];
      
      const result = getUpcomingDeadlines(jobsWithDeadlines, 30);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('daysUntil');
    });

    it('should not include archived jobs', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const archivedJob = [
        { id: '1', job_title: 'Test', company_name: 'Co', application_deadline: futureDate.toISOString(), is_archived: true },
      ];
      
      const result = getUpcomingDeadlines(archivedJob, 30);
      expect(result.length).toBe(0);
    });

    it('should sort by days until deadline', () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() + 10);
      const date2 = new Date();
      date2.setDate(date2.getDate() + 5);
      
      const jobs = [
        { id: '1', job_title: 'Later', company_name: 'Co', application_deadline: date1.toISOString(), is_archived: false },
        { id: '2', job_title: 'Sooner', company_name: 'Co', application_deadline: date2.toISOString(), is_archived: false },
      ];
      
      const result = getUpcomingDeadlines(jobs, 30);
      expect(result[0].jobTitle).toBe('Sooner');
    });
  });

  describe('getMonthlyApplications', () => {
    it('should return monthly application counts', () => {
      const result = getMonthlyApplications(mockJobs, 6);
      expect(result.length).toBe(6);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('count');
    });

    it('should handle empty jobs array', () => {
      const result = getMonthlyApplications([], 6);
      expect(result.length).toBe(6);
      result.forEach(m => expect(m.count).toBe(0));
    });
  });
});

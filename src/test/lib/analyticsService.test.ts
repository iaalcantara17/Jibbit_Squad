import { describe, it, expect } from 'vitest';
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
} from '@/lib/analyticsService';

describe('Analytics Service - Core Metrics', () => {
  describe('calculateApplicationsSent', () => {
    it('counts jobs in application-related statuses', () => {
      const jobs = [
        { id: '1', status: 'interested' },
        { id: '2', status: 'applied' },
        { id: '3', status: 'phone_screen' },
        { id: '4', status: 'interview' },
      ];
      
      expect(calculateApplicationsSent(jobs)).toBe(3);
    });

    it('returns 0 for empty array', () => {
      expect(calculateApplicationsSent([])).toBe(0);
    });
  });

  describe('calculateInterviewsScheduled', () => {
    it('counts interviews with scheduled dates', () => {
      const interviews = [
        { id: '1', scheduled_start: '2025-01-15' },
        { id: '2', interview_date: '2025-01-20' },
        { id: '3', scheduled_start: null, interview_date: null },
      ];
      
      expect(calculateInterviewsScheduled(interviews)).toBe(2);
    });

    it('returns 0 for empty array', () => {
      expect(calculateInterviewsScheduled([])).toBe(0);
    });
  });

  describe('calculateOffersReceived', () => {
    it('counts jobs with offer status', () => {
      const jobs = [
        { id: '1', status: 'applied' },
        { id: '2', status: 'offer' },
        { id: '3', status: 'Offer' },
      ];
      
      expect(calculateOffersReceived(jobs)).toBe(2);
    });

    it('uses offers table when provided', () => {
      const jobs = [{ id: '1', status: 'offer' }];
      const offers = [{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }];
      
      expect(calculateOffersReceived(jobs, offers)).toBe(3);
    });
  });

  describe('calculateConversionRates', () => {
    it('calculates all conversion rates correctly', () => {
      const jobs = [
        { id: '1', status: 'applied' },
        { id: '2', status: 'applied' },
        { id: '3', status: 'interview' },
        { id: '4', status: 'interview' },
        { id: '5', status: 'offer' },
      ];
      
      const rates = calculateConversionRates(jobs);
      
      expect(rates.appliedToInterview).toBe(60); // 3/5 = 60%
      expect(rates.interviewToOffer).toBe(33); // 1/3 = 33%
      expect(rates.appliedToOffer).toBe(20); // 1/5 = 20%
    });

    it('returns 0 for empty jobs', () => {
      const rates = calculateConversionRates([]);
      
      expect(rates.appliedToInterview).toBe(0);
      expect(rates.interviewToOffer).toBe(0);
      expect(rates.appliedToOffer).toBe(0);
    });
  });

  describe('calculateMedianTimeToResponse', () => {
    it('calculates median correctly with odd number of entries', () => {
      const jobs = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ];
      
      const history = [
        { job_id: '1', to_status: 'Applied', changed_at: '2025-01-01' },
        { job_id: '1', to_status: 'Interview', changed_at: '2025-01-06' }, // 5 days
        { job_id: '2', to_status: 'applied', changed_at: '2025-01-01' },
        { job_id: '2', to_status: 'interview', changed_at: '2025-01-11' }, // 10 days
        { job_id: '3', to_status: 'Applied', changed_at: '2025-01-01' },
        { job_id: '3', to_status: 'Rejected', changed_at: '2025-01-08' }, // 7 days
      ];
      
      expect(calculateMedianTimeToResponse(jobs, history)).toBe(7);
    });

    it('calculates median correctly with even number of entries', () => {
      const jobs = [
        { id: '1' },
        { id: '2' },
      ];
      
      const history = [
        { job_id: '1', to_status: 'applied', changed_at: '2025-01-01' },
        { job_id: '1', to_status: 'interview', changed_at: '2025-01-06' }, // 5 days
        { job_id: '2', to_status: 'Applied', changed_at: '2025-01-01' },
        { job_id: '2', to_status: 'Interview', changed_at: '2025-01-11' }, // 10 days
      ];
      
      expect(calculateMedianTimeToResponse(jobs, history)).toBe(8); // (5 + 10) / 2 = 7.5 → 8
    });

    it('returns null when no response data', () => {
      const jobs = [{ id: '1' }];
      const history = [{ job_id: '1', to_status: 'Applied', changed_at: '2025-01-01' }];
      
      expect(calculateMedianTimeToResponse(jobs, history)).toBeNull();
    });
  });
});

describe('Analytics Service - Filters', () => {
  describe('filterJobsByDateRange', () => {
    it('filters by start date only', () => {
      const jobs = [
        { id: '1', created_at: '2025-01-01' },
        { id: '2', created_at: '2025-01-15' },
        { id: '3', created_at: '2025-02-01' },
      ];
      
      const filtered = filterJobsByDateRange(jobs, new Date('2025-01-10'), null);
      expect(filtered).toHaveLength(2);
    });

    it('filters by end date only', () => {
      const jobs = [
        { id: '1', created_at: '2025-01-01' },
        { id: '2', created_at: '2025-01-15' },
        { id: '3', created_at: '2025-02-01' },
      ];
      
      const filtered = filterJobsByDateRange(jobs, null, new Date('2025-01-20'));
      expect(filtered).toHaveLength(2);
    });

    it('filters by date range', () => {
      const jobs = [
        { id: '1', created_at: '2025-01-01' },
        { id: '2', created_at: '2025-01-15' },
        { id: '3', created_at: '2025-02-01' },
      ];
      
      const filtered = filterJobsByDateRange(
        jobs,
        new Date('2025-01-10'),
        new Date('2025-01-20')
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('returns all jobs when no dates provided', () => {
      const jobs = [{ id: '1' }, { id: '2' }];
      expect(filterJobsByDateRange(jobs, null, null)).toHaveLength(2);
    });
  });

  describe('filterJobsByCompany', () => {
    it('filters jobs by company name', () => {
      const jobs = [
        { id: '1', company_name: 'Google' },
        { id: '2', company_name: 'Microsoft' },
        { id: '3', company_name: 'Google Inc' },
      ];
      
      const filtered = filterJobsByCompany(jobs, 'google');
      expect(filtered).toHaveLength(2);
    });

    it('returns all jobs when company is null', () => {
      const jobs = [{ id: '1' }, { id: '2' }];
      expect(filterJobsByCompany(jobs, null)).toHaveLength(2);
    });
  });

  describe('filterJobsByRole', () => {
    it('filters jobs by role', () => {
      const jobs = [
        { id: '1', job_title: 'Software Engineer' },
        { id: '2', job_title: 'Senior Software Engineer' },
        { id: '3', job_title: 'Product Manager' },
      ];
      
      const filtered = filterJobsByRole(jobs, 'engineer');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterJobsByIndustry', () => {
    it('filters jobs by industry', () => {
      const jobs = [
        { id: '1', industry: 'Technology' },
        { id: '2', industry: 'Finance' },
        { id: '3', industry: 'Tech Startup' },
      ];
      
      const filtered = filterJobsByIndustry(jobs, 'tech');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getUniqueCompanies', () => {
    it('returns sorted unique companies', () => {
      const jobs = [
        { company_name: 'Google' },
        { company_name: 'Microsoft' },
        { company_name: 'Google' },
        { company_name: 'Apple' },
      ];
      
      const companies = getUniqueCompanies(jobs);
      expect(companies).toEqual(['Apple', 'Google', 'Microsoft']);
    });
  });

  describe('getUniqueRoles', () => {
    it('returns sorted unique roles', () => {
      const jobs = [
        { job_title: 'Engineer' },
        { job_title: 'Designer' },
        { job_title: 'Engineer' },
      ];
      
      const roles = getUniqueRoles(jobs);
      expect(roles).toEqual(['Designer', 'Engineer']);
    });
  });

  describe('getUniqueIndustries', () => {
    it('returns sorted unique industries', () => {
      const jobs = [
        { industry: 'Tech' },
        { industry: 'Finance' },
        { industry: null },
        { industry: 'Tech' },
      ];
      
      const industries = getUniqueIndustries(jobs);
      expect(industries).toEqual(['Finance', 'Tech']);
    });
  });
});

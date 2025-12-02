import { describe, it, expect } from 'vitest';
import {
  calculateApplicationsSent,
  calculateInterviewsScheduled,
  calculateOffersReceived,
  calculateConversionRates,
  calculateMedianTimeToResponse,
} from '@/lib/analyticsService';

describe('Analytics Calculations', () => {
  describe('calculateApplicationsSent', () => {
    it('counts jobs with applied status or beyond', () => {
      const jobs = [
        { id: '1', status: 'Applied' },
        { id: '2', status: 'Interview' },
        { id: '3', status: 'Wishlist' },
        { id: '4', status: 'Offer' },
      ];

      const count = calculateApplicationsSent(jobs);
      
      expect(count).toBe(3); // Applied, Interview, Offer (not Wishlist)
    });

    it('handles empty array', () => {
      expect(calculateApplicationsSent([])).toBe(0);
    });

    it('handles lowercase status variants', () => {
      const jobs = [
        { id: '1', status: 'applied' },
        { id: '2', status: 'interview' },
        { id: '3', status: 'offer' },
      ];

      expect(calculateApplicationsSent(jobs)).toBe(3);
    });
  });

  describe('calculateInterviewsScheduled', () => {
    it('counts interviews with scheduled dates', () => {
      const interviews = [
        { id: '1', scheduled_start: '2025-01-15T10:00:00Z' },
        { id: '2', interview_date: '2025-01-16T14:00:00Z' },
        { id: '3', scheduled_start: null },
      ];

      const count = calculateInterviewsScheduled(interviews);
      
      expect(count).toBe(2);
    });
  });

  describe('calculateOffersReceived', () => {
    it('counts jobs with offer status', () => {
      const jobs = [
        { id: '1', status: 'Offer' },
        { id: '2', status: 'Interview' },
        { id: '3', status: 'offer' },
      ];

      const count = calculateOffersReceived(jobs);
      
      expect(count).toBe(2);
    });

    it('uses explicit offers array if provided', () => {
      const jobs = [{ id: '1', status: 'Offer' }];
      const offers = [
        { id: 'o1', job_id: '1', amount: 100000 },
        { id: 'o2', job_id: '2', amount: 120000 },
      ];

      const count = calculateOffersReceived(jobs, offers);
      
      expect(count).toBe(2);
    });
  });

  describe('calculateConversionRates', () => {
    it('calculates correct conversion percentages', () => {
      const jobs = [
        { id: '1', status: 'Applied' },
        { id: '2', status: 'Applied' },
        { id: '3', status: 'Interview' },
        { id: '4', status: 'Offer' },
      ];

      const rates = calculateConversionRates(jobs);
      
      expect(rates.appliedToInterview).toBe(50); // 2/4 = 50%
      expect(rates.interviewToOffer).toBe(50);   // 1/2 = 50%
      expect(rates.appliedToOffer).toBe(25);     // 1/4 = 25%
    });

    it('handles zero applications', () => {
      const rates = calculateConversionRates([]);
      
      expect(rates.appliedToInterview).toBe(0);
      expect(rates.interviewToOffer).toBe(0);
      expect(rates.appliedToOffer).toBe(0);
    });
  });

  describe('calculateMedianTimeToResponse', () => {
    it('calculates median from status history', () => {
      const jobs = [
        { id: 'job-1' },
        { id: 'job-2' },
        { id: 'job-3' },
      ];

      const statusHistory = [
        { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
        { job_id: 'job-1', to_status: 'Interview', changed_at: '2025-01-08T10:00:00Z' }, // 7 days
        { job_id: 'job-2', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
        { job_id: 'job-2', to_status: 'Interview', changed_at: '2025-01-06T10:00:00Z' }, // 5 days
        { job_id: 'job-3', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
        { job_id: 'job-3', to_status: 'Rejected', changed_at: '2025-01-04T10:00:00Z' }, // 3 days
      ];

      const median = calculateMedianTimeToResponse(jobs, statusHistory);
      
      expect(median).toBe(5); // Median of [3, 5, 7] = 5
    });

    it('returns null when no valid response times exist', () => {
      const jobs = [{ id: 'job-1' }];
      const statusHistory = [
        { job_id: 'job-1', to_status: 'Applied', changed_at: '2025-01-01T10:00:00Z' },
      ];

      const median = calculateMedianTimeToResponse(jobs, statusHistory);
      
      expect(median).toBeNull();
    });
  });
});

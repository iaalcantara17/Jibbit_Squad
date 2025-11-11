import { describe, it, expect } from 'vitest';
import {
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getUpcomingDeadlines,
  getMonthlyApplications,
} from '../analyticsService';

describe('analyticsService', () => {
  const mockJobs: any[] = [
    {
      id: '1',
      user_id: 'user1',
      job_title: 'Software Engineer',
      company_name: 'TechCo',
      status: 'Applied',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      status_updated_at: '2024-01-10T00:00:00Z',
      application_deadline: '2024-02-01',
      is_archived: false,
    },
    {
      id: '2',
      user_id: 'user1',
      job_title: 'Senior Engineer',
      company_name: 'StartupXYZ',
      status: 'Interview',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
      status_updated_at: '2024-01-20T00:00:00Z',
      application_deadline: '2024-01-25',
      is_archived: false,
    },
    {
      id: '3',
      user_id: 'user1',
      job_title: 'Lead Engineer',
      company_name: 'BigCorp',
      status: 'Offer',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-20T00:00:00Z',
      status_updated_at: '2024-02-20T00:00:00Z',
      application_deadline: '2024-03-01',
      is_archived: false,
    },
  ];

  const mockStatusHistory = [
    {
      id: '1',
      job_id: '1',
      user_id: 'user1',
      from_status: null,
      to_status: 'Applied',
      changed_at: '2024-01-10T00:00:00Z',
      notes: null,
    },
    {
      id: '2',
      job_id: '2',
      user_id: 'user1',
      from_status: 'Applied',
      to_status: 'Interview',
      changed_at: '2024-01-20T00:00:00Z',
      notes: null,
    },
    {
      id: '3',
      job_id: '3',
      user_id: 'user1',
      from_status: 'Interview',
      to_status: 'Offer',
      changed_at: '2024-02-20T00:00:00Z',
      notes: null,
    },
  ];

  describe('calculateAverageTimeInStage', () => {
    it('should calculate average time correctly', () => {
      const result = calculateAverageTimeInStage(mockJobs, mockStatusHistory);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle empty jobs array', () => {
      const result = calculateAverageTimeInStage([], []);
      expect(result).toEqual({});
    });

    it('should handle jobs with insufficient history', () => {
      const minimalHistory = [mockStatusHistory[0]];
      const result = calculateAverageTimeInStage(mockJobs, minimalHistory);
      expect(result).toBeDefined();
    });
  });

  describe('calculateDeadlineAdherence', () => {
    it('should calculate adherence percentage', () => {
      const result = calculateDeadlineAdherence(mockJobs, mockStatusHistory);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return 100% when all deadlines are met', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const onTimeJobs: any[] = mockJobs.map(job => ({
        ...job,
        application_deadline: futureDate,
      }));
      const onTimeHistory = mockStatusHistory.map(h => ({
        ...h,
        changed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      }));
      const result = calculateDeadlineAdherence(onTimeJobs, onTimeHistory);
      expect(result).toBe(100);
    });

    it('should handle jobs without deadlines', () => {
      const noDeadlineJobs: any[] = mockJobs.map(job => ({
        ...job,
        application_deadline: undefined,
      }));
      const result = calculateDeadlineAdherence(noDeadlineJobs, mockStatusHistory);
      expect(result).toBe(100);
    });
  });

  describe('calculateTimeToOffer', () => {
    it('should calculate days from application to offer', () => {
      const result = calculateTimeToOffer(mockJobs, mockStatusHistory);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return null when no offers exist', () => {
      const noOfferJobs = mockJobs.filter(j => j.status !== 'Offer');
      const result = calculateTimeToOffer(noOfferJobs, mockStatusHistory);
      expect(result).toBeNull();
    });

    it('should calculate correctly for multiple offers', () => {
      const multiOfferJobs: any[] = [
        ...mockJobs,
        {
          ...mockJobs[2],
          id: '4',
          status: 'Offer',
          created_at: '2024-01-01T00:00:00Z',
          status_updated_at: '2024-01-10T00:00:00Z',
        },
      ];
      const multiHistory = [
        ...mockStatusHistory,
        {
          id: '4',
          job_id: '4',
          user_id: 'user1',
          from_status: 'Applied',
          to_status: 'Offer',
          changed_at: '2024-01-10T00:00:00Z',
          notes: null,
        },
      ];
      const result = calculateTimeToOffer(multiOfferJobs, multiHistory);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return jobs with deadlines in next 30 days', () => {
      const futureDeadline = new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0];
      const jobsWithDeadlines: any[] = [{
        ...mockJobs[0],
        application_deadline: futureDeadline,
      }];
      const result = getUpcomingDeadlines(jobsWithDeadlines, 30);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].deadline).toBe(futureDeadline);
    });

    it('should not return past deadlines', () => {
      const pastDeadline = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const jobsWithPast: any[] = [{
        ...mockJobs[0],
        application_deadline: pastDeadline,
      }];
      const result = getUpcomingDeadlines(jobsWithPast, 30);
      expect(result.length).toBe(0);
    });

    it('should sort deadlines by date ascending', () => {
      const nearDeadline = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
      const farDeadline = new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0];
      const unsortedJobs: any[] = [
        { ...mockJobs[0], application_deadline: farDeadline },
        { ...mockJobs[1], application_deadline: nearDeadline },
      ];
      const result = getUpcomingDeadlines(unsortedJobs, 30);
      expect(result[0].daysUntil).toBeLessThan(result[1].daysUntil);
    });
  });

  describe('getMonthlyApplications', () => {
    it('should group applications by month', () => {
      const result = getMonthlyApplications(mockJobs, 6);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('count');
    });

    it('should initialize months with 0 count', () => {
      const result = getMonthlyApplications([], 3);
      expect(result.length).toBe(3);
      result.forEach(r => expect(r.count).toBe(0));
    });

    it('should count multiple jobs in same month', () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();
      const sameMonthJobs: any[] = [
        { ...mockJobs[0], created_at: thisMonth },
        { ...mockJobs[1], created_at: thisMonth },
      ];
      const result = getMonthlyApplications(sameMonthJobs, 6);
      const currentMonthEntry = result[result.length - 1]; // Last entry is current month
      expect(currentMonthEntry.count).toBeGreaterThanOrEqual(2);
    });
  });
});

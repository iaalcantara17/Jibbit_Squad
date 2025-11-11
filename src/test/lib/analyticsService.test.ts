import { describe, it, expect } from 'vitest';
import {
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getUpcomingDeadlines,
  getMonthlyApplications
} from '@/lib/analyticsService';

describe('Analytics Service', () => {
  describe('calculateAverageTimeInStage', () => {
    it('calculates average time spent in each stage', () => {
      const jobs = [
        {
          statusHistory: [
            { status: 'Interested', changedAt: '2025-01-01' },
            { status: 'Applied', changedAt: '2025-01-05' },
            { status: 'Interview', changedAt: '2025-01-15' }
          ]
        }
      ];
      
      const result = calculateAverageTimeInStage(jobs);
      
      expect(result['Interested']).toBe(4);
      expect(result['Applied']).toBe(10);
    });
  });

  describe('calculateDeadlineAdherence', () => {
    it('returns 100% when all deadlines are met', () => {
      const jobs = [
        {
          applicationDeadline: '2025-01-10',
          statusHistory: [{ status: 'Applied', changedAt: '2025-01-05' }]
        }
      ];
      
      const result = calculateDeadlineAdherence(jobs);
      expect(result).toBe(100);
    });

    it('calculates percentage correctly when some deadlines are missed', () => {
      const jobs = [
        {
          applicationDeadline: '2025-01-10',
          statusHistory: [{ status: 'Applied', changedAt: '2025-01-05' }]
        },
        {
          applicationDeadline: '2025-01-10',
          statusHistory: [{ status: 'Applied', changedAt: '2025-01-15' }]
        }
      ];
      
      const result = calculateDeadlineAdherence(jobs);
      expect(result).toBe(50);
    });
  });

  describe('calculateTimeToOffer', () => {
    it('calculates average days from applied to offer', () => {
      const jobs = [
        {
          status: 'Offer',
          statusHistory: [
            { status: 'Applied', changedAt: '2025-01-01' },
            { status: 'Offer', changedAt: '2025-01-21' }
          ]
        }
      ];
      
      const result = calculateTimeToOffer(jobs);
      expect(result).toBe(20);
    });

    it('returns null when no offers exist', () => {
      const jobs = [{ status: 'Applied', statusHistory: [] }];
      
      const result = calculateTimeToOffer(jobs);
      expect(result).toBeNull();
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('returns jobs with deadlines in the next 30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const jobs = [
        {
          id: '1',
          jobTitle: 'Software Engineer',
          company: 'Tech Corp',
          applicationDeadline: futureDate.toISOString(),
          isArchived: false
        }
      ];
      
      const result = getUpcomingDeadlines(jobs);
      expect(result).toHaveLength(1);
      expect(result[0].daysUntil).toBeLessThanOrEqual(30);
    });
  });

  describe('getMonthlyApplications', () => {
    it('returns application counts by month', () => {
      const jobs = [
        {
          statusHistory: [
            { status: 'Applied', changedAt: new Date().toISOString() }
          ]
        }
      ];
      
      const result = getMonthlyApplications(jobs, 6);
      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('count');
    });
  });
});
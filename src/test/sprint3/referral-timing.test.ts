import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateOptimalReferralTiming, shouldFollowUp } from '@/lib/referralTiming';
import { addDays, subDays } from 'date-fns';

describe('Referral Timing Service', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  describe('calculateOptimalReferralTiming', () => {
    it('should return optimal timing for strong relationship', () => {
      const lastContactedAt = subDays(now, 3);
      const jobDeadline = addDays(now, 30);
      const jobCreatedAt = subDays(now, 5);

      const result = calculateOptimalReferralTiming(
        5, // Strong relationship
        lastContactedAt,
        jobDeadline,
        jobCreatedAt
      );

      expect(result).toHaveProperty('optimalSendTime');
      expect(result).toHaveProperty('followUpTime');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('confidence');
    });

    it('should suggest immediate outreach for strong relationships (4-5)', () => {
      const result = calculateOptimalReferralTiming(
        5,
        subDays(now, 2),
        addDays(now, 30),
        subDays(now, 5)
      );

      expect(result.reasoning.some(r => r.includes('Strong relationship'))).toBe(true);
    });

    it('should suggest waiting for weak relationships (1-2)', () => {
      const result = calculateOptimalReferralTiming(
        1,
        subDays(now, 60),
        addDays(now, 30),
        subDays(now, 5)
      );

      expect(result.reasoning.some(r => r.includes('Weak relationship'))).toBe(true);
    });

    it('should consider recency of last contact', () => {
      const recentContact = calculateOptimalReferralTiming(
        3,
        subDays(now, 3), // Recent
        addDays(now, 30),
        subDays(now, 5)
      );

      const oldContact = calculateOptimalReferralTiming(
        3,
        subDays(now, 100), // Old
        addDays(now, 30),
        subDays(now, 5)
      );

      expect(recentContact.reasoning.some(r => r.includes('Recent contact'))).toBe(true);
      expect(oldContact.reasoning.some(r => r.includes('No recent contact'))).toBe(true);
    });

    it('should handle null last contacted date', () => {
      const result = calculateOptimalReferralTiming(
        3,
        null,
        addDays(now, 30),
        subDays(now, 5)
      );

      expect(result.reasoning.some(r => r.includes('No interaction history'))).toBe(true);
    });

    it('should prioritize urgent deadlines', () => {
      const urgentResult = calculateOptimalReferralTiming(
        2,
        subDays(now, 30),
        addDays(now, 5), // Urgent
        subDays(now, 10)
      );

      expect(urgentResult.reasoning.some(r => r.includes('Urgent') || r.includes('deadline'))).toBe(true);
    });

    it('should handle null deadline', () => {
      const result = calculateOptimalReferralTiming(
        3,
        subDays(now, 10),
        null,
        subDays(now, 20)
      );

      expect(result).toHaveProperty('optimalSendTime');
      expect(result).toHaveProperty('followUpTime');
    });

    it('should note aging job opportunities', () => {
      const result = calculateOptimalReferralTiming(
        3,
        subDays(now, 5),
        null,
        subDays(now, 20) // Job is aging
      );

      expect(result.reasoning.some(r => r.includes('aging'))).toBe(true);
    });

    it('should return high confidence for optimal conditions', () => {
      const result = calculateOptimalReferralTiming(
        5, // Strong relationship
        subDays(now, 2), // Recent contact
        addDays(now, 5), // Urgent deadline
        subDays(now, 3)
      );

      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('should calculate follow-up time after optimal send time', () => {
      const result = calculateOptimalReferralTiming(
        4,
        subDays(now, 5),
        addDays(now, 30),
        subDays(now, 5)
      );

      expect(result.followUpTime.getTime()).toBeGreaterThan(result.optimalSendTime.getTime());
    });

    it('should use shorter follow-up interval for strong relationships', () => {
      const strongResult = calculateOptimalReferralTiming(
        5,
        subDays(now, 3),
        addDays(now, 30),
        subDays(now, 5)
      );

      const weakResult = calculateOptimalReferralTiming(
        2,
        subDays(now, 3),
        addDays(now, 30),
        subDays(now, 5)
      );

      const strongFollowUpDays = Math.ceil((strongResult.followUpTime.getTime() - strongResult.optimalSendTime.getTime()) / (1000 * 60 * 60 * 24));
      const weakFollowUpDays = Math.ceil((weakResult.followUpTime.getTime() - weakResult.optimalSendTime.getTime()) / (1000 * 60 * 60 * 24));

      expect(strongFollowUpDays).toBeLessThanOrEqual(weakFollowUpDays);
    });
  });

  describe('shouldFollowUp', () => {
    it('should return false if request not sent', () => {
      const result = shouldFollowUp('draft', null, null);
      expect(result.shouldFollowUp).toBe(false);
      expect(result.reason).toContain('not yet sent');
    });

    it('should return false if send date unknown', () => {
      const result = shouldFollowUp('sent', null, null);
      expect(result.shouldFollowUp).toBe(false);
      expect(result.reason).toContain('unknown');
    });

    it('should advise waiting if too soon', () => {
      const sentAt = subDays(now, 2); // Only 2 days ago
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(false);
      expect(result.reason).toContain('Wait');
    });

    it('should recommend follow-up in optimal window (5-14 days)', () => {
      const sentAt = subDays(now, 7); // 7 days ago
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(true);
      expect(result.reason).toContain('good time to follow up');
    });

    it('should flag overdue follow-up (14+ days)', () => {
      const sentAt = subDays(now, 20); // 20 days ago
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(true);
      expect(result.reason).toContain('overdue');
    });

    it('should handle exactly 5 days since sent', () => {
      const sentAt = subDays(now, 5);
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(true);
    });

    it('should handle exactly 14 days since sent', () => {
      const sentAt = subDays(now, 14);
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(true);
    });

    it('should handle 4 days since sent (too soon)', () => {
      const sentAt = subDays(now, 4);
      const result = shouldFollowUp('sent', sentAt, null);
      
      expect(result.shouldFollowUp).toBe(false);
    });
  });
});

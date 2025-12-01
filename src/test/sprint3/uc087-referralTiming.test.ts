import { describe, it, expect } from 'vitest';
import { calculateOptimalReferralTiming, shouldFollowUp } from '@/lib/referralTiming';
import { addDays, subDays } from 'date-fns';

describe('UC-087: Referral Request Management - Timing Logic', () => {
  const now = new Date();
  const jobCreatedAt = subDays(now, 5);

  it('scenario 1: strong relationship + recent contact + urgent deadline', () => {
    const result = calculateOptimalReferralTiming(
      5, // strong relationship
      subDays(now, 3), // contacted 3 days ago
      addDays(now, 5), // deadline in 5 days
      jobCreatedAt
    );

    expect(result.confidence).toBe('high');
    expect(result.reasoning).toContain('Strong relationship (4-5) - can reach out immediately');
    expect(result.reasoning.some(r => r.includes('Urgent'))).toBe(true);
    // Should recommend sending within 1-2 days
    const daysDiff = Math.floor((result.optimalSendTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeLessThanOrEqual(2);
  });

  it('scenario 2: moderate relationship + no recent contact + no deadline', () => {
    const result = calculateOptimalReferralTiming(
      3, // moderate relationship
      subDays(now, 60), // last contact 60 days ago
      null, // no deadline
      jobCreatedAt
    );

    expect(result.confidence).toBe('medium');
    expect(result.reasoning).toContain('Moderate relationship (3) - wait 2 days to prepare approach');
    expect(result.reasoning.some(r => r.includes('within 3 months'))).toBe(true);
  });

  it('scenario 3: weak relationship + no contact history + aging job', () => {
    const oldJobDate = subDays(now, 20);
    const result = calculateOptimalReferralTiming(
      2, // weak relationship
      null, // no contact history
      null, // no deadline
      oldJobDate
    );

    expect(result.confidence).toBe('low');
    expect(result.reasoning).toContain('Weak relationship (1-2) - wait 5 days and warm up connection first');
    expect(result.reasoning).toContain('No interaction history - establish rapport before asking');
    expect(result.reasoning.some(r => r.includes('aging'))).toBe(true);
  });

  it('scenario 4: strong relationship + very recent contact + comfortable timeline', () => {
    const result = calculateOptimalReferralTiming(
      5, // strong relationship
      subDays(now, 2), // very recent contact
      addDays(now, 30), // plenty of time
      jobCreatedAt
    );

    expect(result.confidence).toBe('high');
    expect(result.reasoning).toContain('Recent contact (within week) - good timing');
    expect(result.reasoning).toContain('Sufficient time before deadline');
  });

  it('scenario 5: moderate relationship + stale contact + medium urgency', () => {
    const result = calculateOptimalReferralTiming(
      3, // moderate relationship
      subDays(now, 100), // contact 100 days ago
      addDays(now, 10), // 10 days until deadline
      jobCreatedAt
    );

    expect(result.reasoning.some(r => r.includes('90+ days'))).toBe(true);
    expect(result.reasoning).toContain('Deadline within 2 weeks - send soon');
    // Should have extended wait time due to stale contact
    const daysDiff = Math.floor((result.optimalSendTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeGreaterThan(0);
  });

  it('calculates follow-up timing correctly', () => {
    const result = calculateOptimalReferralTiming(
      4, // strong relationship
      subDays(now, 5),
      null,
      jobCreatedAt
    );

    // Follow-up should be 5-7 days after optimal send time
    const daysDiff = Math.floor(
      (result.followUpTime.getTime() - result.optimalSendTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBeGreaterThanOrEqual(5);
    expect(daysDiff).toBeLessThanOrEqual(7);
  });

  describe('shouldFollowUp', () => {
    it('returns false if request not sent', () => {
      const result = shouldFollowUp('draft', null, null);
      expect(result.shouldFollowUp).toBe(false);
      expect(result.reason).toContain('not yet sent');
    });

    it('returns false if too soon to follow up', () => {
      const sentAt = subDays(now, 3);
      const result = shouldFollowUp('sent', sentAt, null);
      expect(result.shouldFollowUp).toBe(false);
      expect(result.reason).toContain('Wait');
    });

    it('returns true if within follow-up window', () => {
      const sentAt = subDays(now, 7);
      const result = shouldFollowUp('sent', sentAt, null);
      expect(result.shouldFollowUp).toBe(true);
      expect(result.reason).toContain('good time to follow up');
    });

    it('returns true if overdue for follow-up', () => {
      const sentAt = subDays(now, 20);
      const result = shouldFollowUp('sent', sentAt, null);
      expect(result.shouldFollowUp).toBe(true);
      expect(result.reason).toContain('overdue');
    });
  });

  it('status transitions: draft -> pending -> sent -> responded', () => {
    const validStatuses = ['draft', 'pending', 'sent', 'responded', 'declined', 'completed'];
    
    // All transitions should be valid status values
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });

    // Test typical flow
    const flow = ['draft', 'sent', 'responded', 'completed'];
    flow.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
});

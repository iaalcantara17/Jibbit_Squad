// UC-087: Referral request optimal timing logic

import { differenceInDays, addDays } from 'date-fns';

export interface TimingSuggestion {
  optimalSendTime: Date;
  followUpTime: Date;
  reasoning: string[];
  confidence: 'high' | 'medium' | 'low';
}

export function calculateOptimalReferralTiming(
  relationshipStrength: number, // 1-5
  lastContactedAt: Date | null,
  jobDeadline: Date | null,
  jobCreatedAt: Date
): TimingSuggestion {
  const now = new Date();
  const reasoning: string[] = [];
  let optimalDaysFromNow = 0;
  let confidenceScore = 0;

  // Factor 1: Relationship strength (strongest influence)
  if (relationshipStrength >= 4) {
    optimalDaysFromNow = 1; // Strong relationship = reach out soon
    reasoning.push('Strong relationship (4-5) - can reach out immediately');
    confidenceScore += 40;
  } else if (relationshipStrength === 3) {
    optimalDaysFromNow = 2;
    reasoning.push('Moderate relationship (3) - wait 2 days to prepare approach');
    confidenceScore += 30;
  } else {
    optimalDaysFromNow = 5;
    reasoning.push('Weak relationship (1-2) - wait 5 days and warm up connection first');
    confidenceScore += 20;
  }

  // Factor 2: Last contacted (recency matters)
  if (lastContactedAt) {
    const daysSinceContact = differenceInDays(now, new Date(lastContactedAt));
    if (daysSinceContact < 7) {
      reasoning.push('Recent contact (within week) - good timing');
      confidenceScore += 30;
    } else if (daysSinceContact < 30) {
      reasoning.push('Contact within month - acceptable timing');
      optimalDaysFromNow += 1;
      confidenceScore += 20;
    } else if (daysSinceContact < 90) {
      reasoning.push('Contact within 3 months - consider reconnecting first');
      optimalDaysFromNow += 3;
      confidenceScore += 10;
    } else {
      reasoning.push('No recent contact (90+ days) - strongly recommend warming up connection first');
      optimalDaysFromNow += 7;
    }
  } else {
    reasoning.push('No interaction history - establish rapport before asking');
    optimalDaysFromNow += 5;
  }

  // Factor 3: Job deadline urgency
  if (jobDeadline) {
    const daysUntilDeadline = differenceInDays(new Date(jobDeadline), now);
    if (daysUntilDeadline < 7) {
      optimalDaysFromNow = Math.min(optimalDaysFromNow, 1); // Override - urgent
      reasoning.push(`Urgent: Only ${daysUntilDeadline} days until deadline`);
      confidenceScore += 20;
    } else if (daysUntilDeadline < 14) {
      optimalDaysFromNow = Math.min(optimalDaysFromNow, 2);
      reasoning.push('Deadline within 2 weeks - send soon');
      confidenceScore += 15;
    } else {
      reasoning.push('Sufficient time before deadline');
      confidenceScore += 10;
    }
  } else {
    const daysSinceJobCreated = differenceInDays(now, new Date(jobCreatedAt));
    if (daysSinceJobCreated > 14) {
      reasoning.push('Job opportunity is aging - consider sending soon');
      optimalDaysFromNow = Math.max(1, optimalDaysFromNow - 2);
    }
  }

  const optimalSendTime = addDays(now, optimalDaysFromNow);
  
  // Follow-up: 5-7 days after send (industry standard)
  const followUpDaysAfterSend = relationshipStrength >= 4 ? 5 : 7;
  const followUpTime = addDays(optimalSendTime, followUpDaysAfterSend);

  // Confidence calculation
  const confidence: 'high' | 'medium' | 'low' = 
    confidenceScore >= 70 ? 'high' : 
    confidenceScore >= 50 ? 'medium' : 'low';

  return {
    optimalSendTime,
    followUpTime,
    reasoning,
    confidence,
  };
}

export function shouldFollowUp(
  status: string,
  sentAt: Date | null,
  followUpAt: Date | null
): { shouldFollowUp: boolean; reason: string } {
  if (status !== 'sent') {
    return { shouldFollowUp: false, reason: 'Request not yet sent' };
  }

  if (!sentAt) {
    return { shouldFollowUp: false, reason: 'Send date unknown' };
  }

  const now = new Date();
  const daysSinceSent = differenceInDays(now, new Date(sentAt));

  // Default follow-up window: 5-7 days
  const minFollowUpDays = 5;
  const maxFollowUpDays = 14;

  if (daysSinceSent < minFollowUpDays) {
    return { 
      shouldFollowUp: false, 
      reason: `Wait ${minFollowUpDays - daysSinceSent} more days before following up` 
    };
  }

  if (daysSinceSent <= maxFollowUpDays) {
    return { 
      shouldFollowUp: true, 
      reason: `${daysSinceSent} days since request - good time to follow up` 
    };
  }

  return { 
    shouldFollowUp: true, 
    reason: `${daysSinceSent} days since request - overdue for follow-up` 
  };
}

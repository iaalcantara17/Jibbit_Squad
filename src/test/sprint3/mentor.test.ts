import { describe, it, expect } from 'vitest';

/**
 * Sprint 3 UC-109: Mentor Dashboard and Coaching Tools Tests
 * Sprint 3 UC-111: Progress Sharing and Accountability Tests
 * Sprint 3 UC-116: Comprehensive Unit Test Coverage
 */

// Mock mentee progress calculation
const calculateMenteeProgress = (mentee: any) => {
  const metrics = {
    applicationsSubmitted: mentee.applications_count || 0,
    interviewsCompleted: mentee.interviews_count || 0,
    offersReceived: mentee.offers_count || 0,
    goalsCompleted: mentee.goals_completed || 0,
    goalsTotal: mentee.goals_total || 0,
  };
  
  const goalCompletionRate = metrics.goalsTotal > 0 
    ? (metrics.goalsCompleted / metrics.goalsTotal) * 100 
    : 0;
  
  const activityScore = (
    (metrics.applicationsSubmitted * 1) +
    (metrics.interviewsCompleted * 5) +
    (metrics.offersReceived * 10) +
    (metrics.goalsCompleted * 3)
  );
  
  return {
    ...metrics,
    goalCompletionRate,
    activityScore,
    progressLevel: activityScore > 50 ? 'high' : activityScore > 20 ? 'medium' : 'low',
  };
};

// Mock feedback validation
const validateMentorFeedback = (feedback: any) => {
  const errors: string[] = [];
  
  if (!feedback.mentee_id) errors.push('Mentee is required');
  if (!feedback.feedback_text?.trim()) errors.push('Feedback text is required');
  if (feedback.feedback_text && feedback.feedback_text.length < 10) {
    errors.push('Feedback must be at least 10 characters');
  }
  if (!feedback.feedback_type) errors.push('Feedback type is required');
  
  const validTypes = ['encouragement', 'suggestion', 'milestone', 'concern'];
  if (feedback.feedback_type && !validTypes.includes(feedback.feedback_type)) {
    errors.push('Invalid feedback type');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Mock mentee ranking/prioritization
const prioritizeMentees = (mentees: any[]) => {
  return [...mentees]
    .map(mentee => {
      let priority = 0;
      
      // Higher priority for inactive mentees
      if (mentee.days_since_activity > 7) priority += 30;
      if (mentee.days_since_activity > 14) priority += 20;
      
      // Higher priority for upcoming interviews
      if (mentee.upcoming_interviews > 0) priority += 25;
      
      // Higher priority for pending feedback
      if (mentee.pending_reviews > 0) priority += 15;
      
      // Lower priority if recently contacted
      if (mentee.days_since_last_contact < 3) priority -= 20;
      
      return { ...mentee, priority: Math.max(0, priority) };
    })
    .sort((a, b) => b.priority - a.priority);
};

// Mock goal tracking
const trackGoalProgress = (goals: any[]): { total: number; completed: number; inProgress: number; notStarted: number; overdue: number; completionRate: number } => {
  const summary = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    notStarted: goals.filter(g => g.status === 'not_started').length,
    overdue: goals.filter(g => g.status !== 'completed' && new Date(g.due_date) < new Date()).length,
    completionRate: 0,
  };
  
  summary.completionRate = summary.total > 0 
    ? (summary.completed / summary.total) * 100 
    : 0;
  
  return summary;
};

// Mock accountability check
const generateAccountabilityReport = (mentee: any, goals: any[], period: string) => {
  const goalProgress = trackGoalProgress(goals);
  const menteeProgress = calculateMenteeProgress(mentee);
  
  return {
    period,
    menteeId: mentee.id,
    summary: {
      goalsCompleted: goalProgress.completed,
      goalsOverdue: goalProgress.overdue,
      applicationsSubmitted: menteeProgress.applicationsSubmitted,
      interviewsCompleted: menteeProgress.interviewsCompleted,
    },
    recommendations: generateRecommendations(goalProgress, menteeProgress),
    overallRating: calculateOverallRating(goalProgress, menteeProgress),
  };
};

const generateRecommendations = (goalProgress: any, menteeProgress: any) => {
  const recommendations: string[] = [];
  
  if (goalProgress.overdue > 0) {
    recommendations.push('Review and update overdue goals');
  }
  if (menteeProgress.applicationsSubmitted < 5) {
    recommendations.push('Increase application volume');
  }
  if (menteeProgress.progressLevel === 'low') {
    recommendations.push('Schedule check-in call');
  }
  
  return recommendations;
};

const calculateOverallRating = (goalProgress: any, menteeProgress: any) => {
  let score = 0;
  score += goalProgress.completionRate * 0.4;
  score += (menteeProgress.activityScore > 50 ? 40 : menteeProgress.activityScore);
  score += (menteeProgress.offersReceived > 0 ? 20 : 0);
  return Math.min(100, Math.round(score));
};

describe('Mentee Progress Calculation', () => {
  describe('calculateMenteeProgress', () => {
    it('should calculate progress metrics', () => {
      const mentee = {
        applications_count: 20,
        interviews_count: 5,
        offers_count: 1,
        goals_completed: 3,
        goals_total: 5,
      };
      
      const progress = calculateMenteeProgress(mentee);
      expect(progress.applicationsSubmitted).toBe(20);
      expect(progress.goalCompletionRate).toBe(60);
      expect(progress.activityScore).toBe(20 + 25 + 10 + 9); // 64
      expect(progress.progressLevel).toBe('high');
    });

    it('should handle zero goals', () => {
      const mentee = {
        applications_count: 5,
        goals_completed: 0,
        goals_total: 0,
      };
      
      const progress = calculateMenteeProgress(mentee);
      expect(progress.goalCompletionRate).toBe(0);
    });

    it('should classify low progress', () => {
      const mentee = {
        applications_count: 2,
        interviews_count: 0,
        offers_count: 0,
        goals_completed: 1,
        goals_total: 5,
      };
      
      const progress = calculateMenteeProgress(mentee);
      expect(progress.progressLevel).toBe('low');
    });

    it('should handle missing fields', () => {
      const mentee = {};
      const progress = calculateMenteeProgress(mentee);
      expect(progress.applicationsSubmitted).toBe(0);
      expect(progress.activityScore).toBe(0);
    });
  });
});

describe('Mentor Feedback Validation', () => {
  describe('validateMentorFeedback', () => {
    it('should validate complete feedback', () => {
      const feedback = {
        mentee_id: 'mentee-123',
        feedback_text: 'Great progress this week! Keep up the momentum.',
        feedback_type: 'encouragement',
      };
      
      const result = validateMentorFeedback(feedback);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should require mentee_id', () => {
      const feedback = {
        feedback_text: 'Some feedback',
        feedback_type: 'suggestion',
      };
      
      const result = validateMentorFeedback(feedback);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mentee is required');
    });

    it('should require minimum feedback length', () => {
      const feedback = {
        mentee_id: 'mentee-123',
        feedback_text: 'Short',
        feedback_type: 'suggestion',
      };
      
      const result = validateMentorFeedback(feedback);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Feedback must be at least 10 characters');
    });

    it('should validate feedback type', () => {
      const feedback = {
        mentee_id: 'mentee-123',
        feedback_text: 'This is valid feedback text',
        feedback_type: 'invalid_type',
      };
      
      const result = validateMentorFeedback(feedback);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid feedback type');
    });
  });
});

describe('Mentee Prioritization', () => {
  describe('prioritizeMentees', () => {
    it('should prioritize inactive mentees', () => {
      const mentees = [
        { id: '1', name: 'Active', days_since_activity: 1, days_since_last_contact: 5 },
        { id: '2', name: 'Inactive', days_since_activity: 10, days_since_last_contact: 5 },
      ];
      
      const prioritized = prioritizeMentees(mentees);
      expect(prioritized[0].id).toBe('2');
      expect(prioritized[0].priority).toBeGreaterThan(prioritized[1].priority);
    });

    it('should prioritize mentees with upcoming interviews', () => {
      const mentees = [
        { id: '1', name: 'No Interview', upcoming_interviews: 0, days_since_activity: 1, days_since_last_contact: 5 },
        { id: '2', name: 'Has Interview', upcoming_interviews: 2, days_since_activity: 1, days_since_last_contact: 5 },
      ];
      
      const prioritized = prioritizeMentees(mentees);
      expect(prioritized[0].id).toBe('2');
    });

    it('should lower priority for recently contacted', () => {
      const mentees = [
        { id: '1', name: 'Not Contacted', days_since_activity: 5, days_since_last_contact: 10 },
        { id: '2', name: 'Just Contacted', days_since_activity: 5, days_since_last_contact: 1 },
      ];
      
      const prioritized = prioritizeMentees(mentees);
      expect(prioritized[0].id).toBe('1');
    });

    it('should handle empty array', () => {
      const prioritized = prioritizeMentees([]);
      expect(prioritized.length).toBe(0);
    });
  });
});

describe('Goal Tracking', () => {
  describe('trackGoalProgress', () => {
    it('should summarize goal statuses', () => {
      const goals = [
        { id: '1', status: 'completed', due_date: '2025-01-01' },
        { id: '2', status: 'completed', due_date: '2025-01-15' },
        { id: '3', status: 'in_progress', due_date: '2025-12-31' },
        { id: '4', status: 'not_started', due_date: '2025-12-31' },
      ];
      
      const summary = trackGoalProgress(goals);
      expect(summary.total).toBe(4);
      expect(summary.completed).toBe(2);
      expect(summary.inProgress).toBe(1);
      expect(summary.notStarted).toBe(1);
      expect(summary.completionRate).toBe(50);
    });

    it('should identify overdue goals', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const goals = [
        { id: '1', status: 'in_progress', due_date: pastDate },
        { id: '2', status: 'completed', due_date: pastDate }, // Completed goals not overdue
      ];
      
      const summary = trackGoalProgress(goals);
      expect(summary.overdue).toBe(1);
    });

    it('should handle empty goals', () => {
      const summary = trackGoalProgress([]);
      expect(summary.total).toBe(0);
      expect(summary.completionRate).toBe(0);
    });
  });
});

describe('Accountability Report', () => {
  describe('generateAccountabilityReport', () => {
    it('should generate comprehensive report', () => {
      const mentee = {
        id: 'mentee-123',
        applications_count: 15,
        interviews_count: 3,
        offers_count: 0,
        goals_completed: 2,
        goals_total: 4,
      };
      
      const goals = [
        { id: '1', status: 'completed', due_date: '2025-12-31' },
        { id: '2', status: 'completed', due_date: '2025-12-31' },
        { id: '3', status: 'in_progress', due_date: '2025-12-31' },
      ];
      
      const report = generateAccountabilityReport(mentee, goals, 'weekly');
      expect(report.period).toBe('weekly');
      expect(report.menteeId).toBe('mentee-123');
      expect(report.summary.applicationsSubmitted).toBe(15);
      expect(report.overallRating).toBeGreaterThan(0);
    });

    it('should include recommendations for low activity', () => {
      const mentee = {
        id: 'mentee-123',
        applications_count: 2,
      };
      
      const goals = [
        { id: '1', status: 'not_started', due_date: new Date(Date.now() - 86400000).toISOString() },
      ];
      
      const report = generateAccountabilityReport(mentee, goals, 'weekly');
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain('Increase application volume');
    });
  });
});

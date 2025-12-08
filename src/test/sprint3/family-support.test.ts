import { describe, it, expect } from 'vitest';

/**
 * Sprint 3 UC-113: Family and Personal Support Integration Tests
 * Sprint 3 UC-116: Comprehensive Unit Test Coverage
 */

// Mock family-friendly progress summary generation
const generateFamilySummary = (progress: any) => {
  // Remove sensitive details like salary, specific company names
  const summary = {
    overallStatus: getOverallStatus(progress),
    applicationsMilestone: getMilestoneDescription(progress.applicationsCount),
    interviewsMilestone: getMilestoneDescription(progress.interviewsCount),
    progressPercentage: progress.goalProgress || 0,
    encouragement: getEncouragementMessage(progress),
    lastActivity: progress.lastActivityDate ? 'Recently active' : 'No recent activity',
  };
  
  return summary;
};

const getOverallStatus = (progress: any) => {
  if (progress.offersCount > 0) return 'Receiving offers!';
  if (progress.interviewsCount > 0) return 'Interviewing with companies';
  if (progress.applicationsCount > 0) return 'Actively applying';
  return 'Getting started';
};

const getMilestoneDescription = (count: number) => {
  if (count >= 50) return 'Excellent progress';
  if (count >= 20) return 'Good momentum';
  if (count >= 5) return 'Getting started';
  return 'Just beginning';
};

const getEncouragementMessage = (progress: any) => {
  const messages = {
    offers: 'Great news! They have received job offers.',
    interviews: 'Making progress with interviews scheduled.',
    applications: 'Working hard on applications.',
    starting: 'Beginning their job search journey.',
  };
  
  if (progress.offersCount > 0) return messages.offers;
  if (progress.interviewsCount > 0) return messages.interviews;
  if (progress.applicationsCount > 0) return messages.applications;
  return messages.starting;
};

// Mock privacy controls
const filterProgressForFamily = (fullProgress: any, privacySettings: any) => {
  const filtered: any = {};
  
  if (privacySettings.showApplicationCount) {
    filtered.applicationsCount = fullProgress.applicationsCount;
  }
  if (privacySettings.showInterviewCount) {
    filtered.interviewsCount = fullProgress.interviewsCount;
  }
  if (privacySettings.showOfferCount) {
    filtered.offersCount = fullProgress.offersCount;
  }
  if (privacySettings.showGoalProgress) {
    filtered.goalProgress = fullProgress.goalProgress;
  }
  // Never show salary details to family
  // Never show specific company names unless explicitly allowed
  
  return filtered;
};

// Mock milestone celebration
const getMilestoneAchievements = (progress: any) => {
  const milestones: any[] = [];
  
  if (progress.applicationsCount >= 1) {
    milestones.push({ type: 'first_application', title: 'First Application Sent!' });
  }
  if (progress.applicationsCount >= 10) {
    milestones.push({ type: 'ten_applications', title: '10 Applications Milestone!' });
  }
  if (progress.interviewsCount >= 1) {
    milestones.push({ type: 'first_interview', title: 'First Interview Scheduled!' });
  }
  if (progress.offersCount >= 1) {
    milestones.push({ type: 'first_offer', title: 'First Job Offer Received!' });
  }
  
  return milestones;
};

// Mock stress/wellbeing indicators
const calculateWellbeingIndicators = (activity: any) => {
  const indicators = {
    activityLevel: 'normal',
    burnoutRisk: 'low',
    suggestedActions: [] as string[],
  };
  
  // High activity might indicate stress
  if (activity.dailyApplications > 10) {
    indicators.activityLevel = 'high';
    indicators.burnoutRisk = 'moderate';
    indicators.suggestedActions.push('Consider taking a break');
  }
  
  // No activity for a while might indicate discouragement
  if (activity.daysSinceLastActivity > 7) {
    indicators.activityLevel = 'low';
    indicators.suggestedActions.push('Check in with your loved one');
  }
  
  // Multiple rejections might affect morale
  if (activity.recentRejections > 5) {
    indicators.suggestedActions.push('Offer emotional support');
  }
  
  return indicators;
};

describe('Family-Friendly Progress Summary', () => {
  describe('generateFamilySummary', () => {
    it('should generate summary for active job seeker', () => {
      const progress = {
        applicationsCount: 25,
        interviewsCount: 5,
        offersCount: 0,
        goalProgress: 60,
        lastActivityDate: new Date().toISOString(),
      };
      
      const summary = generateFamilySummary(progress);
      expect(summary.overallStatus).toBe('Interviewing with companies');
      expect(summary.applicationsMilestone).toBe('Good momentum');
      expect(summary.progressPercentage).toBe(60);
      expect(summary.lastActivity).toBe('Recently active');
    });

    it('should show excitement for offers', () => {
      const progress = {
        applicationsCount: 30,
        interviewsCount: 10,
        offersCount: 2,
        goalProgress: 100,
      };
      
      const summary = generateFamilySummary(progress);
      expect(summary.overallStatus).toBe('Receiving offers!');
      expect(summary.encouragement).toContain('job offers');
    });

    it('should handle beginner stage', () => {
      const progress = {
        applicationsCount: 2,
        interviewsCount: 0,
        offersCount: 0,
        goalProgress: 10,
      };
      
      const summary = generateFamilySummary(progress);
      expect(summary.overallStatus).toBe('Actively applying');
      expect(summary.applicationsMilestone).toBe('Just beginning');
    });
  });

  describe('getOverallStatus', () => {
    it('should prioritize offers', () => {
      expect(getOverallStatus({ offersCount: 1, interviewsCount: 5, applicationsCount: 20 }))
        .toBe('Receiving offers!');
    });

    it('should show interviews if no offers', () => {
      expect(getOverallStatus({ offersCount: 0, interviewsCount: 3, applicationsCount: 20 }))
        .toBe('Interviewing with companies');
    });

    it('should show applying if no interviews', () => {
      expect(getOverallStatus({ offersCount: 0, interviewsCount: 0, applicationsCount: 5 }))
        .toBe('Actively applying');
    });

    it('should show getting started if no applications', () => {
      expect(getOverallStatus({ offersCount: 0, interviewsCount: 0, applicationsCount: 0 }))
        .toBe('Getting started');
    });
  });
});

describe('Privacy Controls', () => {
  describe('filterProgressForFamily', () => {
    const fullProgress = {
      applicationsCount: 25,
      interviewsCount: 5,
      offersCount: 1,
      goalProgress: 75,
      salaryDetails: { min: 80000, max: 120000 },
      companyNames: ['Company A', 'Company B'],
    };

    it('should filter based on privacy settings', () => {
      const settings = {
        showApplicationCount: true,
        showInterviewCount: false,
        showOfferCount: true,
        showGoalProgress: true,
      };
      
      const filtered = filterProgressForFamily(fullProgress, settings);
      expect(filtered.applicationsCount).toBe(25);
      expect(filtered.interviewsCount).toBeUndefined();
      expect(filtered.offersCount).toBe(1);
      expect(filtered.salaryDetails).toBeUndefined();
      expect(filtered.companyNames).toBeUndefined();
    });

    it('should never expose salary details', () => {
      const settings = {
        showApplicationCount: true,
        showInterviewCount: true,
        showOfferCount: true,
        showGoalProgress: true,
      };
      
      const filtered = filterProgressForFamily(fullProgress, settings);
      expect(filtered.salaryDetails).toBeUndefined();
    });

    it('should hide everything if all settings are false', () => {
      const settings = {
        showApplicationCount: false,
        showInterviewCount: false,
        showOfferCount: false,
        showGoalProgress: false,
      };
      
      const filtered = filterProgressForFamily(fullProgress, settings);
      expect(Object.keys(filtered).length).toBe(0);
    });
  });
});

describe('Milestone Celebrations', () => {
  describe('getMilestoneAchievements', () => {
    it('should track first application', () => {
      const progress = { applicationsCount: 1, interviewsCount: 0, offersCount: 0 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.some(m => m.type === 'first_application')).toBe(true);
    });

    it('should track 10 applications milestone', () => {
      const progress = { applicationsCount: 10, interviewsCount: 0, offersCount: 0 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.some(m => m.type === 'ten_applications')).toBe(true);
    });

    it('should track first interview', () => {
      const progress = { applicationsCount: 15, interviewsCount: 1, offersCount: 0 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.some(m => m.type === 'first_interview')).toBe(true);
    });

    it('should track first offer', () => {
      const progress = { applicationsCount: 20, interviewsCount: 5, offersCount: 1 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.some(m => m.type === 'first_offer')).toBe(true);
    });

    it('should accumulate multiple milestones', () => {
      const progress = { applicationsCount: 25, interviewsCount: 5, offersCount: 1 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.length).toBeGreaterThan(2);
    });

    it('should return empty for no progress', () => {
      const progress = { applicationsCount: 0, interviewsCount: 0, offersCount: 0 };
      const milestones = getMilestoneAchievements(progress);
      expect(milestones.length).toBe(0);
    });
  });
});

describe('Wellbeing Indicators', () => {
  describe('calculateWellbeingIndicators', () => {
    it('should detect high activity (potential burnout)', () => {
      const activity = { dailyApplications: 15, daysSinceLastActivity: 0, recentRejections: 2 };
      const indicators = calculateWellbeingIndicators(activity);
      expect(indicators.activityLevel).toBe('high');
      expect(indicators.burnoutRisk).toBe('moderate');
      expect(indicators.suggestedActions).toContain('Consider taking a break');
    });

    it('should detect low activity (potential discouragement)', () => {
      const activity = { dailyApplications: 0, daysSinceLastActivity: 10, recentRejections: 0 };
      const indicators = calculateWellbeingIndicators(activity);
      expect(indicators.activityLevel).toBe('low');
      expect(indicators.suggestedActions).toContain('Check in with your loved one');
    });

    it('should suggest support for multiple rejections', () => {
      const activity = { dailyApplications: 3, daysSinceLastActivity: 1, recentRejections: 8 };
      const indicators = calculateWellbeingIndicators(activity);
      expect(indicators.suggestedActions).toContain('Offer emotional support');
    });

    it('should show normal for balanced activity', () => {
      const activity = { dailyApplications: 3, daysSinceLastActivity: 1, recentRejections: 1 };
      const indicators = calculateWellbeingIndicators(activity);
      expect(indicators.activityLevel).toBe('normal');
      expect(indicators.burnoutRisk).toBe('low');
    });
  });
});

describe('Family Support Resources', () => {
  const getSupportResources = (stage: string) => {
    const resources: Record<string, string[]> = {
      starting: [
        'How to support someone starting their job search',
        'Understanding modern job search timelines',
      ],
      applying: [
        'Tips for encouraging job seekers',
        'How to help without hovering',
      ],
      interviewing: [
        'Supporting someone through interviews',
        'Celebrating small wins',
      ],
      offers: [
        'Helping evaluate job offers',
        'Transition support tips',
      ],
    };
    return resources[stage] || resources.starting;
  };

  it('should provide stage-appropriate resources', () => {
    expect(getSupportResources('starting').length).toBeGreaterThan(0);
    expect(getSupportResources('interviewing')).toContain('Supporting someone through interviews');
    expect(getSupportResources('offers')).toContain('Helping evaluate job offers');
  });

  it('should default to starting resources for unknown stage', () => {
    const resources = getSupportResources('unknown');
    expect(resources).toEqual(getSupportResources('starting'));
  });
});

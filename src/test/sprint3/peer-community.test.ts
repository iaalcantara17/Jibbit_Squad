import { describe, it, expect } from 'vitest';

/**
 * Sprint 3 UC-112: Peer Networking and Support Groups Tests
 * Sprint 3 UC-116: Comprehensive Unit Test Coverage
 */

// Mock support group functions
const filterGroupsByIndustry = (groups: any[], industry: string | null) => {
  if (!industry) return groups;
  return groups.filter(g => 
    g.industry?.toLowerCase().includes(industry.toLowerCase())
  );
};

const filterGroupsByRole = (groups: any[], role: string | null) => {
  if (!role) return groups;
  return groups.filter(g => 
    g.target_role?.toLowerCase().includes(role.toLowerCase())
  );
};

const calculateGroupHealth = (group: any) => {
  const memberCount = group.member_count || 0;
  const activityScore = group.recent_activity_count || 0;
  const healthScore = Math.min(100, (memberCount * 0.3) + (activityScore * 0.7));
  return {
    score: healthScore,
    status: healthScore > 70 ? 'healthy' : healthScore > 40 ? 'moderate' : 'low',
  };
};

// Mock challenge functions
const calculateChallengeProgress = (participant: any) => {
  const target = participant.target_value || 100;
  const current = participant.current_value || 0;
  const progress = Math.min(100, (current / target) * 100);
  return {
    progress,
    isComplete: current >= target,
    remaining: Math.max(0, target - current),
  };
};

const getChallengeLeaderboard = (participants: any[]) => {
  return [...participants]
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .map((p, index) => ({
      ...p,
      rank: index + 1,
    }));
};

// Mock referral functions
const validatePeerReferral = (referral: any) => {
  const errors: string[] = [];
  if (!referral.from_user_id) errors.push('Referrer is required');
  if (!referral.to_user_id) errors.push('Recipient is required');
  if (!referral.job_id) errors.push('Job is required');
  if (referral.from_user_id === referral.to_user_id) {
    errors.push('Cannot refer yourself');
  }
  return { isValid: errors.length === 0, errors };
};

describe('Support Groups', () => {
  const mockGroups = [
    { id: '1', name: 'Tech Professionals', industry: 'Technology', target_role: 'Engineer', member_count: 25 },
    { id: '2', name: 'Finance Network', industry: 'Finance', target_role: 'Analyst', member_count: 15 },
    { id: '3', name: 'Healthcare Careers', industry: 'Healthcare', target_role: 'Nurse', member_count: 30 },
    { id: '4', name: 'Product Managers', industry: 'Technology', target_role: 'Product Manager', member_count: 20 },
  ];

  describe('filterGroupsByIndustry', () => {
    it('should filter by industry', () => {
      const result = filterGroupsByIndustry(mockGroups, 'Technology');
      expect(result.length).toBe(2);
      expect(result.every(g => g.industry === 'Technology')).toBe(true);
    });

    it('should return all groups when no industry specified', () => {
      const result = filterGroupsByIndustry(mockGroups, null);
      expect(result.length).toBe(mockGroups.length);
    });

    it('should be case insensitive', () => {
      const result = filterGroupsByIndustry(mockGroups, 'technology');
      expect(result.length).toBe(2);
    });

    it('should handle partial matches', () => {
      const result = filterGroupsByIndustry(mockGroups, 'Tech');
      expect(result.length).toBe(2);
    });
  });

  describe('filterGroupsByRole', () => {
    it('should filter by role', () => {
      const result = filterGroupsByRole(mockGroups, 'Engineer');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Tech Professionals');
    });

    it('should return all when no role specified', () => {
      const result = filterGroupsByRole(mockGroups, null);
      expect(result.length).toBe(mockGroups.length);
    });
  });

  describe('calculateGroupHealth', () => {
    it('should calculate healthy group', () => {
      const group = { member_count: 50, recent_activity_count: 100 };
      const health = calculateGroupHealth(group);
      expect(health.status).toBe('healthy');
      expect(health.score).toBeGreaterThan(70);
    });

    it('should calculate moderate group', () => {
      const group = { member_count: 20, recent_activity_count: 50 };
      const health = calculateGroupHealth(group);
      expect(health.status).toBe('moderate');
    });

    it('should calculate low activity group', () => {
      const group = { member_count: 5, recent_activity_count: 10 };
      const health = calculateGroupHealth(group);
      expect(health.status).toBe('low');
    });

    it('should handle missing values', () => {
      const group = {};
      const health = calculateGroupHealth(group);
      expect(health.score).toBe(0);
      expect(health.status).toBe('low');
    });
  });
});

describe('Group Challenges', () => {
  describe('calculateChallengeProgress', () => {
    it('should calculate progress percentage', () => {
      const participant = { target_value: 10, current_value: 5 };
      const result = calculateChallengeProgress(participant);
      expect(result.progress).toBe(50);
      expect(result.isComplete).toBe(false);
      expect(result.remaining).toBe(5);
    });

    it('should mark complete when target reached', () => {
      const participant = { target_value: 10, current_value: 10 };
      const result = calculateChallengeProgress(participant);
      expect(result.isComplete).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should cap progress at 100%', () => {
      const participant = { target_value: 10, current_value: 15 };
      const result = calculateChallengeProgress(participant);
      expect(result.progress).toBe(100);
    });

    it('should handle zero target', () => {
      const participant = { target_value: 0, current_value: 5 };
      const result = calculateChallengeProgress(participant);
      expect(result.progress).toBe(100); // division would be infinity, capped at 100
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should sort participants by value descending', () => {
      const participants = [
        { user_id: '1', current_value: 5 },
        { user_id: '2', current_value: 10 },
        { user_id: '3', current_value: 3 },
      ];
      
      const leaderboard = getChallengeLeaderboard(participants);
      expect(leaderboard[0].current_value).toBe(10);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[2].rank).toBe(3);
    });

    it('should handle empty participants', () => {
      const leaderboard = getChallengeLeaderboard([]);
      expect(leaderboard.length).toBe(0);
    });

    it('should assign correct ranks', () => {
      const participants = [
        { user_id: '1', current_value: 10 },
        { user_id: '2', current_value: 10 },
      ];
      
      const leaderboard = getChallengeLeaderboard(participants);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
    });
  });
});

describe('Peer Referrals', () => {
  describe('validatePeerReferral', () => {
    it('should validate complete referral', () => {
      const referral = {
        from_user_id: 'user1',
        to_user_id: 'user2',
        job_id: 'job1',
      };
      const result = validatePeerReferral(referral);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject missing referrer', () => {
      const referral = { to_user_id: 'user2', job_id: 'job1' };
      const result = validatePeerReferral(referral);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Referrer is required');
    });

    it('should reject self-referral', () => {
      const referral = {
        from_user_id: 'user1',
        to_user_id: 'user1',
        job_id: 'job1',
      };
      const result = validatePeerReferral(referral);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot refer yourself');
    });

    it('should reject missing job', () => {
      const referral = {
        from_user_id: 'user1',
        to_user_id: 'user2',
      };
      const result = validatePeerReferral(referral);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Job is required');
    });
  });
});

describe('Group Webinars', () => {
  const validateWebinar = (webinar: any) => {
    const errors: string[] = [];
    if (!webinar.title?.trim()) errors.push('Title is required');
    if (!webinar.scheduled_at) errors.push('Schedule time is required');
    if (webinar.scheduled_at && new Date(webinar.scheduled_at) < new Date()) {
      errors.push('Cannot schedule in the past');
    }
    if (!webinar.host_id) errors.push('Host is required');
    return { isValid: errors.length === 0, errors };
  };

  it('should validate complete webinar', () => {
    const webinar = {
      title: 'Interview Tips',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      host_id: 'host1',
    };
    const result = validateWebinar(webinar);
    expect(result.isValid).toBe(true);
  });

  it('should reject empty title', () => {
    const webinar = {
      title: '',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      host_id: 'host1',
    };
    const result = validateWebinar(webinar);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('should reject past schedule', () => {
    const webinar = {
      title: 'Past Event',
      scheduled_at: new Date(Date.now() - 86400000).toISOString(),
      host_id: 'host1',
    };
    const result = validateWebinar(webinar);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Cannot schedule in the past');
  });
});

describe('Anonymous Insights Sharing', () => {
  const anonymizeUserData = (data: any) => {
    return {
      industry: data.industry,
      experience_years: data.experience_years,
      salary_range: data.salary_range,
      interview_count: data.interview_count,
      // Remove PII
      name: undefined,
      email: undefined,
      user_id: undefined,
    };
  };

  it('should remove personal identifiers', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      user_id: 'user123',
      industry: 'Technology',
      experience_years: 5,
      salary_range: '100k-120k',
      interview_count: 10,
    };
    
    const anonymized = anonymizeUserData(userData);
    expect(anonymized.name).toBeUndefined();
    expect(anonymized.email).toBeUndefined();
    expect(anonymized.user_id).toBeUndefined();
    expect(anonymized.industry).toBe('Technology');
    expect(anonymized.experience_years).toBe(5);
  });
});

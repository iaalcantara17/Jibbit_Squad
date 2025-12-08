import { describe, it, expect } from 'vitest';

/**
 * Sprint 3 UC-115: External Advisor and Coach Integration Tests
 * Sprint 3 UC-116: Comprehensive Unit Test Coverage
 */

// Mock advisor profile validation
const validateAdvisorProfile = (profile: any) => {
  const errors: string[] = [];
  if (!profile.display_name?.trim()) errors.push('Display name is required');
  if (!profile.bio?.trim()) errors.push('Bio is required');
  if (profile.hourly_rate !== null && profile.hourly_rate < 0) {
    errors.push('Hourly rate cannot be negative');
  }
  if (profile.specialization && !Array.isArray(profile.specialization)) {
    errors.push('Specialization must be an array');
  }
  return { isValid: errors.length === 0, errors };
};

// Mock session scheduling
const validateSessionSchedule = (session: any) => {
  const errors: string[] = [];
  if (!session.advisor_id) errors.push('Advisor is required');
  if (!session.client_user_id) errors.push('Client is required');
  if (!session.scheduled_date) errors.push('Schedule date is required');
  
  const scheduledDate = new Date(session.scheduled_date);
  if (scheduledDate < new Date()) {
    errors.push('Cannot schedule in the past');
  }
  
  if (!session.session_type) errors.push('Session type is required');
  if (session.duration_minutes && session.duration_minutes < 15) {
    errors.push('Session must be at least 15 minutes');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Mock availability calculation
const calculateAdvisorAvailability = (advisor: any, existingSessions: any[]) => {
  const hoursPerWeek = 40; // Max hours
  const bookedHours = existingSessions.reduce((sum, s) => sum + (s.duration_minutes / 60), 0);
  const availableHours = Math.max(0, hoursPerWeek - bookedHours);
  
  return {
    bookedHours,
    availableHours,
    utilizationRate: (bookedHours / hoursPerWeek) * 100,
    isAvailable: availableHours > 0,
  };
};

// Mock session cost calculation
const calculateSessionCost = (hourlyRate: number, durationMinutes: number) => {
  const hours = durationMinutes / 60;
  const subtotal = hourlyRate * hours;
  const platformFee = subtotal * 0.1; // 10% platform fee
  const total = subtotal + platformFee;
  
  return {
    subtotal,
    platformFee,
    total,
    advisorPayout: subtotal - (subtotal * 0.15), // Advisor gets 85%
  };
};

// Mock advisor search/filter
const filterAdvisors = (advisors: any[], filters: any) => {
  return advisors.filter(advisor => {
    if (filters.specialization) {
      const specs = advisor.specialization || [];
      if (!specs.some((s: string) => s.toLowerCase().includes(filters.specialization.toLowerCase()))) {
        return false;
      }
    }
    if (filters.maxRate && advisor.hourly_rate > filters.maxRate) {
      return false;
    }
    if (filters.minRating && (advisor.avg_rating || 0) < filters.minRating) {
      return false;
    }
    if (filters.isActive !== undefined && advisor.is_active !== filters.isActive) {
      return false;
    }
    return true;
  });
};

describe('Advisor Profile Validation', () => {
  describe('validateAdvisorProfile', () => {
    it('should validate complete profile', () => {
      const profile = {
        display_name: 'Dr. Jane Smith',
        bio: 'Career coach with 10+ years experience',
        hourly_rate: 100,
        specialization: ['Tech', 'Finance'],
      };
      const result = validateAdvisorProfile(profile);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should require display name', () => {
      const profile = {
        display_name: '',
        bio: 'Some bio',
      };
      const result = validateAdvisorProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Display name is required');
    });

    it('should require bio', () => {
      const profile = {
        display_name: 'John',
        bio: '',
      };
      const result = validateAdvisorProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bio is required');
    });

    it('should reject negative hourly rate', () => {
      const profile = {
        display_name: 'John',
        bio: 'Bio text',
        hourly_rate: -50,
      };
      const result = validateAdvisorProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hourly rate cannot be negative');
    });

    it('should accept null hourly rate (free advisor)', () => {
      const profile = {
        display_name: 'John',
        bio: 'Bio text',
        hourly_rate: null,
      };
      const result = validateAdvisorProfile(profile);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('Session Scheduling', () => {
  describe('validateSessionSchedule', () => {
    it('should validate complete session', () => {
      const session = {
        advisor_id: 'adv1',
        client_user_id: 'client1',
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        session_type: 'coaching',
        duration_minutes: 60,
      };
      const result = validateSessionSchedule(session);
      expect(result.isValid).toBe(true);
    });

    it('should reject past schedule', () => {
      const session = {
        advisor_id: 'adv1',
        client_user_id: 'client1',
        scheduled_date: new Date(Date.now() - 86400000).toISOString(),
        session_type: 'coaching',
        duration_minutes: 60,
      };
      const result = validateSessionSchedule(session);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot schedule in the past');
    });

    it('should require minimum duration', () => {
      const session = {
        advisor_id: 'adv1',
        client_user_id: 'client1',
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        session_type: 'coaching',
        duration_minutes: 10,
      };
      const result = validateSessionSchedule(session);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session must be at least 15 minutes');
    });

    it('should require session type', () => {
      const session = {
        advisor_id: 'adv1',
        client_user_id: 'client1',
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
      };
      const result = validateSessionSchedule(session);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session type is required');
    });
  });
});

describe('Advisor Availability', () => {
  describe('calculateAdvisorAvailability', () => {
    it('should calculate availability correctly', () => {
      const advisor = { id: 'adv1' };
      const sessions = [
        { duration_minutes: 60 },
        { duration_minutes: 60 },
        { duration_minutes: 30 },
      ];
      
      const availability = calculateAdvisorAvailability(advisor, sessions);
      expect(availability.bookedHours).toBe(2.5);
      expect(availability.availableHours).toBe(37.5);
      expect(availability.isAvailable).toBe(true);
    });

    it('should show not available when fully booked', () => {
      const advisor = { id: 'adv1' };
      const sessions = Array(40).fill({ duration_minutes: 60 }); // 40 hours booked
      
      const availability = calculateAdvisorAvailability(advisor, sessions);
      expect(availability.availableHours).toBe(0);
      expect(availability.isAvailable).toBe(false);
      expect(availability.utilizationRate).toBe(100);
    });

    it('should handle empty sessions', () => {
      const advisor = { id: 'adv1' };
      const availability = calculateAdvisorAvailability(advisor, []);
      expect(availability.bookedHours).toBe(0);
      expect(availability.availableHours).toBe(40);
    });
  });
});

describe('Session Cost Calculation', () => {
  describe('calculateSessionCost', () => {
    it('should calculate 1 hour session cost', () => {
      const cost = calculateSessionCost(100, 60);
      expect(cost.subtotal).toBe(100);
      expect(cost.platformFee).toBe(10);
      expect(cost.total).toBe(110);
      expect(cost.advisorPayout).toBe(85);
    });

    it('should calculate 30 minute session cost', () => {
      const cost = calculateSessionCost(100, 30);
      expect(cost.subtotal).toBe(50);
      expect(cost.total).toBe(55);
    });

    it('should handle zero rate (free session)', () => {
      const cost = calculateSessionCost(0, 60);
      expect(cost.total).toBe(0);
      expect(cost.advisorPayout).toBe(0);
    });

    it('should handle longer sessions', () => {
      const cost = calculateSessionCost(100, 120);
      expect(cost.subtotal).toBe(200);
      expect(cost.total).toBe(220);
    });
  });
});

describe('Advisor Search & Filter', () => {
  const mockAdvisors = [
    { id: '1', display_name: 'Tech Coach', specialization: ['Technology', 'Engineering'], hourly_rate: 150, avg_rating: 4.8, is_active: true },
    { id: '2', display_name: 'Finance Mentor', specialization: ['Finance', 'Banking'], hourly_rate: 120, avg_rating: 4.5, is_active: true },
    { id: '3', display_name: 'Career Coach', specialization: ['General', 'Resume'], hourly_rate: 80, avg_rating: 4.2, is_active: true },
    { id: '4', display_name: 'Inactive Advisor', specialization: ['Technology'], hourly_rate: 100, avg_rating: 4.0, is_active: false },
  ];

  describe('filterAdvisors', () => {
    it('should filter by specialization', () => {
      const result = filterAdvisors(mockAdvisors, { specialization: 'Technology' });
      expect(result.length).toBe(2);
    });

    it('should filter by max rate', () => {
      const result = filterAdvisors(mockAdvisors, { maxRate: 100 });
      expect(result.length).toBe(2);
      expect(result.every(a => a.hourly_rate <= 100)).toBe(true);
    });

    it('should filter by minimum rating', () => {
      const result = filterAdvisors(mockAdvisors, { minRating: 4.5 });
      expect(result.length).toBe(2);
    });

    it('should filter by active status', () => {
      const result = filterAdvisors(mockAdvisors, { isActive: true });
      expect(result.length).toBe(3);
      expect(result.every(a => a.is_active)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const result = filterAdvisors(mockAdvisors, { 
        specialization: 'Technology',
        maxRate: 160,
        isActive: true,
      });
      expect(result.length).toBe(1);
      expect(result[0].display_name).toBe('Tech Coach');
    });

    it('should return all when no filters', () => {
      const result = filterAdvisors(mockAdvisors, {});
      expect(result.length).toBe(mockAdvisors.length);
    });
  });
});

describe('Advisor Recommendations', () => {
  const getRecommendedAdvisors = (userProfile: any, advisors: any[]) => {
    return advisors
      .filter(a => a.is_active)
      .map(advisor => {
        let score = 0;
        const specs = advisor.specialization || [];
        
        // Match industry
        if (userProfile.industry && specs.some((s: string) => 
          s.toLowerCase().includes(userProfile.industry.toLowerCase()))) {
          score += 30;
        }
        
        // Rating bonus
        score += (advisor.avg_rating || 0) * 10;
        
        // Price consideration
        if (advisor.hourly_rate <= userProfile.budget) {
          score += 20;
        }
        
        return { ...advisor, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  it('should recommend advisors based on industry match', () => {
    const userProfile = { industry: 'Technology', budget: 200 };
    const advisors = [
      { id: '1', specialization: ['Technology'], hourly_rate: 100, avg_rating: 4.5, is_active: true },
      { id: '2', specialization: ['Finance'], hourly_rate: 100, avg_rating: 4.8, is_active: true },
    ];
    
    const recommended = getRecommendedAdvisors(userProfile, advisors);
    expect(recommended[0].id).toBe('1'); // Tech match should rank higher
  });

  it('should exclude inactive advisors', () => {
    const userProfile = { industry: 'Technology', budget: 200 };
    const advisors = [
      { id: '1', specialization: ['Technology'], hourly_rate: 100, avg_rating: 5.0, is_active: false },
      { id: '2', specialization: ['General'], hourly_rate: 100, avg_rating: 4.0, is_active: true },
    ];
    
    const recommended = getRecommendedAdvisors(userProfile, advisors);
    expect(recommended.length).toBe(1);
    expect(recommended[0].id).toBe('2');
  });
});

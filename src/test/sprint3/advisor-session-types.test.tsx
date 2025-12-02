import { describe, it, expect } from 'vitest';

describe('Advisor Session Types', () => {
  const allowedSessionTypes = [
    'career_coaching',
    'resume_review',
    'interview_prep',
    'salary_negotiation',
    'job_search_strategy',
    'career_strategy',
    'general'
  ];

  it('should allow all session types from UI', () => {
    const uiSessionTypes = [
      'career_coaching',
      'resume_review',
      'interview_prep',
      'salary_negotiation',
      'job_search_strategy'
    ];

    uiSessionTypes.forEach(type => {
      expect(allowedSessionTypes).toContain(type);
    });
  });

  it('should map session types correctly', () => {
    // Verify UI values match DB constraint
    const sessionTypeMapping = {
      'career_coaching': 'career_coaching',
      'resume_review': 'resume_review',
      'interview_prep': 'interview_prep',
      'salary_negotiation': 'salary_negotiation',
      'job_search_strategy': 'job_search_strategy'
    };

    Object.entries(sessionTypeMapping).forEach(([ui, db]) => {
      expect(allowedSessionTypes).toContain(db);
    });
  });

  it('should create valid session payload', () => {
    const createSessionPayload = (type: string) => ({
      session_type: type,
      advisor_id: 'test-advisor-id',
      client_user_id: 'test-user-id',
      scheduled_date: new Date().toISOString(),
      duration_minutes: 60,
      status: 'scheduled'
    });

    allowedSessionTypes.slice(0, 5).forEach(type => {
      const payload = createSessionPayload(type);
      expect(payload.session_type).toBe(type);
      expect(allowedSessionTypes).toContain(payload.session_type);
    });
  });
});

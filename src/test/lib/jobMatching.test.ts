import { describe, it, expect } from 'vitest';
import { calculateJobMatch } from '@/lib/jobMatchingAlgorithm';

describe('Job Matching Algorithm', () => {
  const mockProfile = {
    skills: [
      { name: 'JavaScript', level: 'expert' },
      { name: 'React', level: 'expert' },
      { name: 'TypeScript', level: 'advanced' },
    ],
    employment_history: [
      {
        title: 'Senior Frontend Engineer',
        company: 'TechCo',
        description: 'Built scalable web applications using React and TypeScript',
      },
    ],
    education: [
      { degree: 'BS', field: 'Computer Science', institution: 'University' },
    ],
    experience_level: 'senior',
    location: 'San Francisco, CA',
  };

  it('calculates high match score for aligned job', () => {
    const job = {
      job_title: 'Senior React Developer',
      job_description: 'Looking for expert JavaScript/TypeScript developer with React experience',
      company_name: 'TestCorp',
      location: 'San Francisco, CA',
    };

    const result = calculateJobMatch(job, mockProfile);

    expect(result.overall_score).toBeGreaterThan(60);
    expect(result.skills_score).toBeGreaterThan(0);
    expect(result.location_score).toBe(100);
    expect(result.strengths).toContain('Location match');
  });

  it('identifies gaps for misaligned job', () => {
    const job = {
      job_title: 'Backend Python Engineer',
      job_description: 'Expert in Python, Django, PostgreSQL, Docker required',
      company_name: 'Backend Co',
      location: 'New York, NY',
    };

    const result = calculateJobMatch(job, mockProfile);

    expect(result.overall_score).toBeLessThan(50);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it('provides recommendations based on score', () => {
    const strongJob = {
      job_title: 'React Engineer',
      job_description: 'React TypeScript JavaScript',
      company_name: 'Corp',
      location: 'San Francisco, CA',
    };

    const result = calculateJobMatch(strongJob, mockProfile);
    expect(result.recommendations.some((r) => r.includes('Strong match'))).toBe(true);
  });
});

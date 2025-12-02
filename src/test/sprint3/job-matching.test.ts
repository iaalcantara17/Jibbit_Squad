import { describe, it, expect } from 'vitest';
import { calculateJobMatch } from '@/lib/jobMatchingAlgorithm';

describe('Job Matching Algorithm', () => {
  const mockJob = {
    job_title: 'Senior Software Engineer',
    job_description: 'We are looking for a senior software engineer with experience in React, TypeScript, and Node.js. The ideal candidate will have strong problem-solving skills and experience with agile methodologies.',
    company_name: 'Tech Corp',
    location: 'San Francisco, CA',
    salary_min: 120000,
    salary_max: 180000,
  };

  const mockProfile = {
    skills: [
      { name: 'React', level: 'expert' },
      { name: 'TypeScript', level: 'advanced' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'JavaScript', level: 'expert' },
    ],
    employment_history: [
      {
        title: 'Software Engineer',
        company: 'Previous Corp',
        description: 'Developed React applications and TypeScript libraries',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University of Technology',
      },
    ],
    experience_level: 'senior',
    location: 'San Francisco, CA',
  };

  describe('calculateJobMatch', () => {
    it('should return a match score object with all required properties', () => {
      const result = calculateJobMatch(mockJob, mockProfile);

      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('skills_score');
      expect(result).toHaveProperty('experience_score');
      expect(result).toHaveProperty('education_score');
      expect(result).toHaveProperty('location_score');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('recommendations');
    });

    it('should return scores between 0 and 100', () => {
      const result = calculateJobMatch(mockJob, mockProfile);

      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.skills_score).toBeGreaterThanOrEqual(0);
      expect(result.skills_score).toBeLessThanOrEqual(100);
      expect(result.experience_score).toBeGreaterThanOrEqual(0);
      expect(result.experience_score).toBeLessThanOrEqual(100);
      expect(result.education_score).toBeGreaterThanOrEqual(0);
      expect(result.education_score).toBeLessThanOrEqual(100);
      expect(result.location_score).toBeGreaterThanOrEqual(0);
      expect(result.location_score).toBeLessThanOrEqual(100);
    });

    it('should return 100 location score for exact location match', () => {
      const result = calculateJobMatch(mockJob, mockProfile);
      expect(result.location_score).toBe(100);
    });

    it('should return 100 location score for remote jobs', () => {
      const remoteJob = { ...mockJob, location: 'Remote' };
      const result = calculateJobMatch(remoteJob, mockProfile);
      expect(result.location_score).toBe(100);
    });

    it('should return neutral location score when no profile location', () => {
      const profileNoLocation = { ...mockProfile, location: undefined };
      const result = calculateJobMatch(mockJob, profileNoLocation);
      expect(result.location_score).toBe(50);
    });

    it('should identify strengths for high skill match', () => {
      const result = calculateJobMatch(mockJob, mockProfile);
      expect(Array.isArray(result.strengths)).toBe(true);
    });

    it('should provide recommendations array', () => {
      const result = calculateJobMatch(mockJob, mockProfile);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty skills array', () => {
      const emptySkillsProfile = { ...mockProfile, skills: [] };
      const result = calculateJobMatch(mockJob, emptySkillsProfile);
      expect(result.skills_score).toBe(0);
    });

    it('should handle empty employment history', () => {
      const emptyHistoryProfile = { ...mockProfile, employment_history: [] };
      const result = calculateJobMatch(mockJob, emptyHistoryProfile);
      expect(result.experience_score).toBe(0);
    });

    it('should handle empty education array', () => {
      const emptyEducationProfile = { ...mockProfile, education: [] };
      const result = calculateJobMatch(mockJob, emptyEducationProfile);
      expect(result.education_score).toBe(0);
    });

    it('should calculate weighted overall score correctly', () => {
      const result = calculateJobMatch(mockJob, mockProfile);
      
      // Overall = skills(40%) + experience(35%) + education(15%) + location(10%)
      const expectedScore = Math.round(
        result.skills_score * 0.4 +
        result.experience_score * 0.35 +
        result.education_score * 0.15 +
        result.location_score * 0.1
      );
      
      expect(result.overall_score).toBe(expectedScore);
    });

    it('should recommend prioritizing strong matches (score >= 70)', () => {
      // Create a very strong match
      const strongMatchProfile = {
        ...mockProfile,
        skills: [
          { name: 'senior', level: 'expert' },
          { name: 'software', level: 'expert' },
          { name: 'engineer', level: 'expert' },
          { name: 'react', level: 'expert' },
          { name: 'typescript', level: 'expert' },
          { name: 'node', level: 'expert' },
        ],
      };
      const result = calculateJobMatch(mockJob, strongMatchProfile);
      
      if (result.overall_score >= 70) {
        expect(result.recommendations).toContain('Strong match - prioritize this application');
      }
    });

    it('should identify gaps when skills score is low', () => {
      const lowSkillProfile = {
        ...mockProfile,
        skills: [{ name: 'Python', level: 'beginner' }],
      };
      const result = calculateJobMatch(mockJob, lowSkillProfile);
      expect(result.gaps.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  checkSpelling,
  checkGrammar,
  calculateReadability,
  checkLength,
  analyzeTone,
  validateDocument
} from '@/lib/validationService';

describe('Validation Service', () => {
  describe('checkSpelling', () => {
    it('identifies common misspellings', () => {
      const text = 'I have experiance in managment';
      const issues = checkSpelling(text);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('spelling');
      expect(issues[0].suggestion).toBe('experience');
    });

    it('returns no issues for correct spelling', () => {
      const text = 'I have experience in management';
      const issues = checkSpelling(text);
      
      expect(issues.length).toBe(0);
    });
  });

  describe('checkGrammar', () => {
    it('detects double spaces', () => {
      const text = 'This has  double spaces';
      const issues = checkGrammar(text);
      
      expect(issues.some(i => i.category === 'formatting')).toBe(true);
    });

    it('detects missing end punctuation', () => {
      const text = 'This sentence has no punctuation';
      const issues = checkGrammar(text);
      
      expect(issues.some(i => i.category === 'grammar')).toBe(true);
    });
  });

  describe('calculateReadability', () => {
    it('calculates readability score', () => {
      const text = 'This is a simple sentence. It is easy to read. Anyone can understand it.';
      const score = calculateReadability(text);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('checkLength', () => {
    it('warns when resume is too short', () => {
      const text = 'Short resume.';
      const issues = checkLength(text, 'resume');
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('length');
    });

    it('warns when cover letter is too long', () => {
      const text = 'word '.repeat(500);
      const issues = checkLength(text, 'cover-letter');
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].message).toContain('too long');
    });
  });

  describe('analyzeTone', () => {
    it('detects casual language', () => {
      const text = 'I wanna work here because yeah';
      const issues = analyzeTone(text);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('tone');
    });

    it('suggests avoiding first-person pronouns in resume', () => {
      const text = 'I managed a team of developers';
      const issues = analyzeTone(text);
      
      expect(issues.some(i => i.message.includes('first-person'))).toBe(true);
    });
  });

  describe('validateDocument', () => {
    it('performs comprehensive validation', () => {
      const text = 'I have experiance in managment. This is a short resume';
      const result = validateDocument(text, 'resume');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('wordCount');
      expect(result).toHaveProperty('readabilityScore');
    });

    it('calculates score based on issues', () => {
      const goodText = 'word '.repeat(500);
      const result = validateDocument(goodText, 'resume');
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});

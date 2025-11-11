import { describe, it, expect } from 'vitest';
import { 
  validateDocument, 
  checkSpelling, 
  checkGrammar, 
  calculateReadability 
} from '@/lib/validationService';

describe('Resume Validation Service', () => {
  describe('checkSpelling', () => {
    it('detects common spelling errors', () => {
      const text = 'I have experiance in managment';
      const issues = checkSpelling(text);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].category).toBe('spelling');
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

    it('detects missing ending punctuation', () => {
      const text = 'This sentence has no punctuation';
      const issues = checkGrammar(text);
      
      expect(issues.some(i => i.message.includes('Missing punctuation'))).toBe(true);
    });
  });

  describe('calculateReadability', () => {
    it('calculates readability score', () => {
      const text = 'This is a simple sentence. It is easy to read.';
      const score = calculateReadability(text);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('validateDocument', () => {
    it('validates resume length', () => {
      const shortText = 'Too short';
      const result = validateDocument(shortText, 'resume');
      
      expect(result.issues.some(i => i.category === 'length')).toBe(true);
    });

    it('provides comprehensive validation results', () => {
      const text = 'Professional experience in software development with strong technical skills.';
      const result = validateDocument(text, 'resume');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('readabilityScore');
      expect(result).toHaveProperty('wordCount');
    });
  });
});
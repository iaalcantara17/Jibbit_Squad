import { describe, it, expect } from 'vitest';
import {
  checkSpelling,
  checkGrammar,
  calculateReadability,
  checkLength,
  analyzeTone,
  validateDocument,
} from '@/lib/validationService';

describe('Validation Service', () => {
  describe('checkSpelling', () => {
    it('should detect common misspellings', () => {
      const text = 'I recieve the email and teh document';
      const issues = checkSpelling(text);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.suggestion === 'receive')).toBe(true);
      expect(issues.some(i => i.suggestion === 'the')).toBe(true);
    });

    it('should return empty array for correct spelling', () => {
      const text = 'This is a correctly spelled sentence.';
      const issues = checkSpelling(text);
      expect(issues.length).toBe(0);
    });

    it('should detect "definately" misspelling', () => {
      const text = 'I will definately attend the meeting';
      const issues = checkSpelling(text);
      expect(issues.some(i => i.suggestion === 'definitely')).toBe(true);
    });

    it('should handle empty string', () => {
      const issues = checkSpelling('');
      expect(issues).toEqual([]);
    });

    it('should categorize spelling issues correctly', () => {
      const text = 'I recieve this';
      const issues = checkSpelling(text);
      issues.forEach(issue => {
        expect(issue.type).toBe('error');
        expect(issue.category).toBe('spelling');
      });
    });
  });

  describe('checkGrammar', () => {
    it('should detect double spaces', () => {
      const text = 'This has  double spaces.';
      const issues = checkGrammar(text);
      expect(issues.some(i => i.message.includes('Multiple consecutive spaces'))).toBe(true);
    });

    it('should detect missing punctuation at end', () => {
      const text = 'This sentence has no ending punctuation';
      const issues = checkGrammar(text);
      expect(issues.some(i => i.message.includes('Missing punctuation'))).toBe(true);
    });

    it('should pass for properly formatted text', () => {
      const text = 'This is proper. Another sentence here.';
      const issues = checkGrammar(text);
      const punctuationIssues = issues.filter(i => i.message.includes('Missing punctuation'));
      expect(punctuationIssues.length).toBe(0);
    });

    it('should handle empty string', () => {
      const issues = checkGrammar('');
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should detect sentences starting with lowercase', () => {
      const text = 'First sentence. second sentence starts lowercase.';
      const issues = checkGrammar(text);
      expect(issues.some(i => i.message.includes('capital letter'))).toBe(true);
    });
  });

  describe('calculateReadability', () => {
    it('should return a score between 0 and 100', () => {
      const text = 'This is a simple sentence. It is easy to read. Short words help.';
      const score = calculateReadability(text);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 0 for empty text', () => {
      const score = calculateReadability('');
      expect(score).toBe(0);
    });

    it('should give higher score for simpler text', () => {
      const simpleText = 'The cat sat. The dog ran. I like sun.';
      const complexText = 'The anthropomorphization of inanimate objects demonstrates psychological mechanisms.';
      
      const simpleScore = calculateReadability(simpleText);
      const complexScore = calculateReadability(complexText);
      
      expect(simpleScore).toBeGreaterThan(complexScore);
    });

    it('should handle single word', () => {
      const score = calculateReadability('Hello');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkLength', () => {
    it('should warn if resume is too short', () => {
      const shortText = 'This is too short.';
      const issues = checkLength(shortText, 'resume');
      expect(issues.some(i => i.message.includes('too short'))).toBe(true);
    });

    it('should warn if resume is too long', () => {
      const longText = 'word '.repeat(900);
      const issues = checkLength(longText, 'resume');
      expect(issues.some(i => i.message.includes('too long'))).toBe(true);
    });

    it('should not warn for optimal resume length', () => {
      const optimalText = 'word '.repeat(500);
      const issues = checkLength(optimalText, 'resume');
      expect(issues.length).toBe(0);
    });

    it('should warn if cover letter is too short', () => {
      const shortText = 'This is too short.';
      const issues = checkLength(shortText, 'cover-letter');
      expect(issues.some(i => i.message.includes('too short'))).toBe(true);
    });

    it('should warn if cover letter is too long', () => {
      const longText = 'word '.repeat(500);
      const issues = checkLength(longText, 'cover-letter');
      expect(issues.some(i => i.message.includes('too long'))).toBe(true);
    });

    it('should not warn for optimal cover letter length', () => {
      const optimalText = 'word '.repeat(300);
      const issues = checkLength(optimalText, 'cover-letter');
      expect(issues.length).toBe(0);
    });
  });

  describe('analyzeTone', () => {
    it('should detect casual language', () => {
      const text = 'I gonna do this task. Wanna help me?';
      const issues = analyzeTone(text);
      expect(issues.some(i => i.message.includes('casual language'))).toBe(true);
    });

    it('should detect first person pronouns in resume context', () => {
      const text = 'I managed a team of developers. My skills include leadership.';
      const issues = analyzeTone(text);
      expect(issues.some(i => i.message.includes('first-person pronouns'))).toBe(true);
    });

    it('should pass for professional language', () => {
      const text = 'Managed team of developers. Led multiple projects successfully.';
      const issues = analyzeTone(text);
      const casualIssues = issues.filter(i => i.message.includes('casual language'));
      expect(casualIssues.length).toBe(0);
    });

    it('should handle empty string', () => {
      const issues = analyzeTone('');
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('validateDocument', () => {
    it('should return complete validation result for resume', () => {
      const text = 'word '.repeat(500) + '.';
      const result = validateDocument(text, 'resume');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('readabilityScore');
      expect(result).toHaveProperty('wordCount');
      expect(result).toHaveProperty('characterCount');
    });

    it('should return complete validation result for cover letter', () => {
      const text = 'word '.repeat(300) + '.';
      const result = validateDocument(text, 'cover-letter');
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('score');
    });

    it('should mark document as invalid if errors exist', () => {
      const text = 'I recieve teh document.';
      const result = validateDocument(text, 'resume');
      expect(result.isValid).toBe(false);
    });

    it('should calculate score based on issues', () => {
      const perfectText = 'Word '.repeat(500) + '.';
      const result = validateDocument(perfectText, 'resume');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should count words correctly', () => {
      const text = 'One two three four five.';
      const result = validateDocument(text, 'resume');
      expect(result.wordCount).toBe(5);
    });

    it('should count characters correctly', () => {
      const text = 'Hello';
      const result = validateDocument(text, 'resume');
      expect(result.characterCount).toBe(5);
    });

    it('should combine all validation checks', () => {
      const text = 'I gonna recieve  teh document';
      const result = validateDocument(text, 'resume');
      
      // Should have spelling, grammar, tone, and length issues
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});

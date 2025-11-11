import { describe, it, expect } from 'vitest';
import { toDbStatus, JOB_STATUS } from '@/lib/constants/jobStatus';

describe('Job Status Mapping', () => {
  describe('toDbStatus', () => {
    it('converts UI labels to DB snake_case', () => {
      expect(toDbStatus('Interested')).toBe('interested');
      expect(toDbStatus('Applied')).toBe('applied');
      expect(toDbStatus('Phone Screen')).toBe('phone_screen');
      expect(toDbStatus('Interview')).toBe('interview');
      expect(toDbStatus('Offer')).toBe('offer');
      expect(toDbStatus('Rejected')).toBe('rejected');
    });

    it('handles direct DB values', () => {
      expect(toDbStatus('interested')).toBe('interested');
      expect(toDbStatus('applied')).toBe('applied');
      expect(toDbStatus('phone_screen')).toBe('phone_screen');
      expect(toDbStatus('interview')).toBe('interview');
      expect(toDbStatus('offer')).toBe('offer');
      expect(toDbStatus('rejected')).toBe('rejected');
    });

    it('trims whitespace', () => {
      expect(toDbStatus('  Interested  ')).toBe('interested');
      expect(toDbStatus('  phone screen  ')).toBe('phone_screen');
    });

    it('is case-insensitive', () => {
      expect(toDbStatus('INTERESTED')).toBe('interested');
      expect(toDbStatus('Phone SCREEN')).toBe('phone_screen');
      expect(toDbStatus('ApPlIeD')).toBe('applied');
    });

    it('defaults unknown statuses to INTERESTED', () => {
      expect(toDbStatus('unknown')).toBe('interested');
      expect(toDbStatus('')).toBe('interested');
      expect(toDbStatus('random status')).toBe('interested');
    });
  });

  describe('Database constraint compatibility', () => {
    it('only returns values allowed by DB constraint', () => {
      const allowedValues = ['interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];
      
      // Test all UI labels
      const uiLabels = ['Interested', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'];
      uiLabels.forEach(label => {
        const result = toDbStatus(label);
        expect(allowedValues).toContain(result);
      });
      
      // Test unknown values default to allowed value
      expect(allowedValues).toContain(toDbStatus('unknown'));
    });
  });

  describe('JOB_STATUS constants', () => {
    it('exports correct snake_case constants', () => {
      expect(JOB_STATUS.INTERESTED).toBe('interested');
      expect(JOB_STATUS.APPLIED).toBe('applied');
      expect(JOB_STATUS.PHONE_SCREEN).toBe('phone_screen');
      expect(JOB_STATUS.INTERVIEW).toBe('interview');
      expect(JOB_STATUS.OFFER).toBe('offer');
      expect(JOB_STATUS.REJECTED).toBe('rejected');
    });
  });
});

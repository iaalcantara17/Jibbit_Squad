import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classnames merge)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toContain('base');
      expect(result).toContain('included');
      expect(result).not.toContain('excluded');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
    });

    it('should handle undefined values', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty string', () => {
      const result = cn('');
      expect(result).toBe('');
    });

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle object syntax', () => {
      const result = cn({ active: true, disabled: false });
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
    });
  });
});

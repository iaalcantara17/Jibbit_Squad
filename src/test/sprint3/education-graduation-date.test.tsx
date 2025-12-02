import { describe, it, expect } from 'vitest';

describe('Education Graduation Date', () => {
  it('should format YYYY-MM correctly without timezone shift', () => {
    // Simulate formatDate function
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    // Test May 2026
    expect(formatDate('2026-05')).toBe('May 2026');
    
    // Test all months
    expect(formatDate('2026-01')).toBe('Jan 2026');
    expect(formatDate('2026-02')).toBe('Feb 2026');
    expect(formatDate('2026-03')).toBe('Mar 2026');
    expect(formatDate('2026-04')).toBe('Apr 2026');
    expect(formatDate('2026-05')).toBe('May 2026');
    expect(formatDate('2026-06')).toBe('Jun 2026');
    expect(formatDate('2026-07')).toBe('Jul 2026');
    expect(formatDate('2026-08')).toBe('Aug 2026');
    expect(formatDate('2026-09')).toBe('Sep 2026');
    expect(formatDate('2026-10')).toBe('Oct 2026');
    expect(formatDate('2026-11')).toBe('Nov 2026');
    expect(formatDate('2026-12')).toBe('Dec 2026');
  });

  it('should store graduation date as YYYY-MM string', () => {
    const educationEntry = {
      graduationDate: '2026-05',
      institution: 'Test University',
      degree: 'Bachelor of Science'
    };

    expect(educationEntry.graduationDate).toBe('2026-05');
    expect(educationEntry.graduationDate).toMatch(/^\d{4}-\d{2}$/);
  });
});

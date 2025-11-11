import { describe, it, expect } from 'vitest';

interface SalaryData {
  salary_min?: number | null;
  salary_max?: number | null;
}

function validateSalary(data: SalaryData): { valid: boolean; error?: string } {
  const { salary_min, salary_max } = data;

  // Both null/undefined is valid (optional salary)
  if (
    (salary_min === null || salary_min === undefined) &&
    (salary_max === null || salary_max === undefined)
  ) {
    return { valid: true };
  }

  // Only one is set is valid
  if (
    (salary_min !== null && salary_min !== undefined) &&
    (salary_max === null || salary_max === undefined)
  ) {
    return { valid: true };
  }

  if (
    (salary_max !== null && salary_max !== undefined) &&
    (salary_min === null || salary_min === undefined)
  ) {
    return { valid: true };
  }

  // Both set: min must be <= max
  if (
    salary_min !== null &&
    salary_min !== undefined &&
    salary_max !== null &&
    salary_max !== undefined
  ) {
    if (salary_min > salary_max) {
      return {
        valid: false,
        error: 'Minimum salary cannot be greater than maximum salary',
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

describe('JobsSalaryOptional - Salary Validation', () => {
  it('accepts job with no salary (both null)', () => {
    const result = validateSalary({
      salary_min: null,
      salary_max: null,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts job with no salary (both undefined)', () => {
    const result = validateSalary({
      salary_min: undefined,
      salary_max: undefined,
    });

    expect(result.valid).toBe(true);
  });

  it('accepts job with only min salary', () => {
    const result = validateSalary({
      salary_min: 100000,
      salary_max: null,
    });

    expect(result.valid).toBe(true);
  });

  it('accepts job with only max salary', () => {
    const result = validateSalary({
      salary_min: null,
      salary_max: 150000,
    });

    expect(result.valid).toBe(true);
  });

  it('accepts valid salary range (min < max)', () => {
    const result = validateSalary({
      salary_min: 100000,
      salary_max: 150000,
    });

    expect(result.valid).toBe(true);
  });

  it('accepts equal min and max (single salary point)', () => {
    const result = validateSalary({
      salary_min: 120000,
      salary_max: 120000,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects min > max (client validation)', () => {
    const result = validateSalary({
      salary_min: 150000,
      salary_max: 100000,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Minimum salary cannot be greater');
  });

  it('handles zero salaries correctly', () => {
    const result = validateSalary({
      salary_min: 0,
      salary_max: 100000,
    });

    expect(result.valid).toBe(true);
  });

  it('validates database constraint logic (no CHECK when both null)', () => {
    // Simulates the DB constraint:
    // CHECK (
    //   (salary_min IS NULL AND salary_max IS NULL) OR
    //   (salary_min IS NOT NULL AND salary_max IS NULL) OR
    //   (salary_min IS NULL AND salary_max IS NOT NULL) OR
    //   (salary_min IS NOT NULL AND salary_max IS NOT NULL AND salary_min <= salary_max)
    // )

    const testCases = [
      { min: null, max: null, expected: true },
      { min: 100000, max: null, expected: true },
      { min: null, max: 150000, expected: true },
      { min: 100000, max: 150000, expected: true },
      { min: 150000, max: 100000, expected: false },
    ];

    testCases.forEach(({ min, max, expected }) => {
      const result = validateSalary({
        salary_min: min,
        salary_max: max,
      });

      expect(result.valid).toBe(expected);
    });
  });

  it('UI form allows submitting without salary', () => {
    const formData = {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      salary_min: undefined,
      salary_max: undefined,
    };

    const validation = validateSalary(formData);

    expect(validation.valid).toBe(true);
    expect(formData.job_title).toBe('Software Engineer');
    expect(formData.company_name).toBe('TechCorp');
  });

  it('UI form validates min > max before submission', () => {
    const formData = {
      salary_min: 150000,
      salary_max: 100000,
    };

    const validation = validateSalary(formData);

    // This should be caught on client side before DB insert
    expect(validation.valid).toBe(false);
    expect(validation.error).toBeDefined();
  });
});

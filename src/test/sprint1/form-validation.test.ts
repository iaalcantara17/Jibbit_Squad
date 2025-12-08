/**
 * Sprint 1 - Form Validation Tests
 * Tests for UC-001, UC-002, UC-021 form validation logic
 */

import { describe, it, expect } from 'vitest';

// Password validation rules per Sprint 1 PRD:
// - Minimum 8 characters
// - At least 1 uppercase
// - At least 1 lowercase
// - At least 1 number
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  // Email must contain @ and valid domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

export function validateConfirmPassword(password: string, confirmPassword: string): { valid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  return { valid: true };
}

export function validateBio(bio: string, maxLength: number = 500): { valid: boolean; error?: string; charCount: number } {
  const charCount = bio.length;
  if (charCount > maxLength) {
    return { valid: false, error: `Bio must be ${maxLength} characters or less`, charCount };
  }
  return { valid: true, charCount };
}

export function validateJobDescription(description: string, maxLength: number = 1000): { valid: boolean; error?: string; charCount: number } {
  const charCount = description.length;
  if (charCount > maxLength) {
    return { valid: false, error: `Description must be ${maxLength} characters or less`, charCount };
  }
  return { valid: true, charCount };
}

export function validateDateRange(startDate: string, endDate: string | null, isCurrent: boolean = false): { valid: boolean; error?: string } {
  if (!startDate) {
    return { valid: false, error: 'Start date is required' };
  }

  if (!isCurrent && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return { valid: false, error: 'End date must be after start date' };
    }
  }

  return { valid: true };
}

describe('Password Validation (UC-001)', () => {
  it('should accept valid password meeting all criteria', () => {
    const result = validatePassword('Password123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('PASSWORD123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('PasswordABC');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should report multiple validation errors', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('should accept password at exactly 8 characters', () => {
    const result = validatePassword('Passwo1d');
    expect(result.valid).toBe(true);
  });

  it('should accept password with special characters', () => {
    const result = validatePassword('Password123!@#');
    expect(result.valid).toBe(true);
  });
});

describe('Email Validation (UC-001, UC-002)', () => {
  it('should accept valid email format', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
    expect(validateEmail('user.name@domain.org').valid).toBe(true);
    expect(validateEmail('user+tag@email.co.uk').valid).toBe(true);
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject email without @ symbol', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('should reject email without TLD', () => {
    const result = validateEmail('user@example');
    expect(result.valid).toBe(false);
  });

  it('should reject email with spaces', () => {
    const result = validateEmail('user @example.com');
    expect(result.valid).toBe(false);
  });
});

describe('Password Confirmation (UC-001)', () => {
  it('should accept matching passwords', () => {
    const result = validateConfirmPassword('Password123', 'Password123');
    expect(result.valid).toBe(true);
  });

  it('should reject non-matching passwords', () => {
    const result = validateConfirmPassword('Password123', 'Password124');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Passwords do not match');
  });

  it('should be case-sensitive', () => {
    const result = validateConfirmPassword('Password123', 'password123');
    expect(result.valid).toBe(false);
  });
});

describe('Name Validation (UC-001, UC-021)', () => {
  it('should accept valid names', () => {
    expect(validateName('John Doe').valid).toBe(true);
    expect(validateName('Jane').valid).toBe(true);
    expect(validateName('Dr. Smith Jr.').valid).toBe(true);
  });

  it('should reject empty name', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should reject whitespace-only name', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject single character name', () => {
    const result = validateName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters');
  });
});

describe('Bio Validation (UC-021)', () => {
  it('should accept bio within character limit', () => {
    const result = validateBio('This is a short bio.');
    expect(result.valid).toBe(true);
    expect(result.charCount).toBe(20);
  });

  it('should accept bio at exactly 500 characters', () => {
    const bio = 'a'.repeat(500);
    const result = validateBio(bio);
    expect(result.valid).toBe(true);
    expect(result.charCount).toBe(500);
  });

  it('should reject bio exceeding 500 characters', () => {
    const bio = 'a'.repeat(501);
    const result = validateBio(bio);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bio must be 500 characters or less');
  });

  it('should accept empty bio', () => {
    const result = validateBio('');
    expect(result.valid).toBe(true);
    expect(result.charCount).toBe(0);
  });
});

describe('Job Description Validation (UC-023)', () => {
  it('should accept description within 1000 character limit', () => {
    const description = 'Responsible for developing and maintaining software applications.';
    const result = validateJobDescription(description);
    expect(result.valid).toBe(true);
  });

  it('should reject description exceeding 1000 characters', () => {
    const description = 'a'.repeat(1001);
    const result = validateJobDescription(description);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Description must be 1000 characters or less');
  });
});

describe('Date Range Validation (UC-023)', () => {
  it('should accept valid date range', () => {
    const result = validateDateRange('2020-01-01', '2022-01-01');
    expect(result.valid).toBe(true);
  });

  it('should reject end date before start date', () => {
    const result = validateDateRange('2022-01-01', '2020-01-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End date must be after start date');
  });

  it('should reject missing start date', () => {
    const result = validateDateRange('', '2022-01-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Start date is required');
  });

  it('should accept null end date for current position', () => {
    const result = validateDateRange('2020-01-01', null, true);
    expect(result.valid).toBe(true);
  });

  it('should accept same start and end date', () => {
    const result = validateDateRange('2020-01-01', '2020-01-01');
    expect(result.valid).toBe(true);
  });
});

describe('Registration Form Complete Validation (UC-001)', () => {
  interface RegistrationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  function validateRegistrationForm(data: RegistrationData): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    const firstNameResult = validateName(data.firstName);
    if (!firstNameResult.valid) errors.firstName = firstNameResult.error!;

    const lastNameResult = validateName(data.lastName);
    if (!lastNameResult.valid) errors.lastName = lastNameResult.error!;

    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) errors.email = emailResult.error!;

    const passwordResult = validatePassword(data.password);
    if (!passwordResult.valid) errors.password = passwordResult.errors[0];

    const confirmResult = validateConfirmPassword(data.password, data.confirmPassword);
    if (!confirmResult.valid) errors.confirmPassword = confirmResult.error!;

    return { valid: Object.keys(errors).length === 0, errors };
  }

  it('should validate complete registration form', () => {
    const result = validateRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should report all validation errors', () => {
    const result = validateRegistrationForm({
      firstName: '',
      lastName: 'A',
      email: 'invalid',
      password: 'weak',
      confirmPassword: 'different',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
    expect(result.errors.confirmPassword).toBeDefined();
  });
});

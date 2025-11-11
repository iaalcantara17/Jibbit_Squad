import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExport } from '@/hooks/useExport';

describe('useExport Hook', () => {
  it('provides all export functions', () => {
    const { result } = renderHook(() => useExport());
    
    expect(result.current).toHaveProperty('exportResumeToPDF');
    expect(result.current).toHaveProperty('exportCoverLetterToPDF');
    expect(result.current).toHaveProperty('exportResumeToText');
    expect(result.current).toHaveProperty('exportCoverLetterToText');
    expect(result.current).toHaveProperty('exportResumeToWord');
    expect(result.current).toHaveProperty('exportCoverLetterToWord');
    expect(result.current).toHaveProperty('exportResumeToHTML');
    expect(result.current).toHaveProperty('exportCoverLetterToHTML');
    expect(result.current).toHaveProperty('exportJobsToCSV');
  });

  it('export functions are functions', () => {
    const { result } = renderHook(() => useExport());
    
    expect(typeof result.current.exportResumeToPDF).toBe('function');
    expect(typeof result.current.exportCoverLetterToPDF).toBe('function');
    expect(typeof result.current.exportJobsToCSV).toBe('function');
  });
});
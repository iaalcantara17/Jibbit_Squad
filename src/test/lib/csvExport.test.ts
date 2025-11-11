import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, exportJobsToCSV } from '@/lib/csvExportService';

describe('CSV Export Service', () => {
  it('exports data to CSV format', () => {
    const data = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' }
    ];

    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Age', accessor: 'age' },
      { header: 'City', accessor: 'city' }
    ];

    // Mock DOM methods
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    exportToCSV(data, columns, 'test-export');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('handles jobs export correctly', () => {
    const jobs = [
      { 
        job_title: 'Software Engineer',
        company_name: 'Tech Corp',
        location: 'Remote',
        status: 'Applied',
        salary_min: 100000,
        salary_max: 150000,
        created_at: '2024-01-01',
        application_deadline: '2024-02-01',
        notes: 'Interesting role'
      }
    ];

    const createElementSpy = vi.spyOn(document, 'createElement');
    exportJobsToCSV(jobs);

    expect(createElementSpy).toHaveBeenCalled();
  });

  it('escapes special characters in CSV', () => {
    const data = [
      { text: 'Text with, comma' },
      { text: 'Text with "quotes"' },
      { text: 'Text with\nnewline' }
    ];

    const columns = [
      { header: 'Text', accessor: 'text' }
    ];

    const createElementSpy = vi.spyOn(document, 'createElement');
    exportToCSV(data, columns, 'special-chars');

    expect(createElementSpy).toHaveBeenCalled();
  });
});

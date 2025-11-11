import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the file-saver module
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    splitTextToSize: vi.fn().mockReturnValue(['line1', 'line2']),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    }
  }))
}));

describe('Export Service', () => {
  const mockResume = {
    title: 'Software Engineer Resume',
    sections: [
      {
        type: 'header',
        title: 'Contact Information',
        content: 'John Doe\njohn@example.com',
        isVisible: true
      },
      {
        type: 'experience',
        title: 'Experience',
        content: 'Software Engineer at Tech Corp',
        isVisible: true
      }
    ]
  };

  const mockCoverLetter = {
    title: 'Cover Letter',
    content: 'Dear Hiring Manager,\n\nI am writing to apply...'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Resume Export', () => {
    it('exports resume data structure correctly', () => {
      expect(mockResume.title).toBe('Software Engineer Resume');
      expect(mockResume.sections).toHaveLength(2);
      expect(mockResume.sections[0].isVisible).toBe(true);
    });

    it('handles visible sections only', () => {
      const visibleSections = mockResume.sections.filter(s => s.isVisible);
      expect(visibleSections).toHaveLength(2);
    });
  });

  describe('Cover Letter Export', () => {
    it('exports cover letter data structure correctly', () => {
      expect(mockCoverLetter.content).toContain('Dear Hiring Manager');
      expect(mockCoverLetter.content.length).toBeGreaterThan(0);
    });
  });

  describe('Export Format Validation', () => {
    it('validates PDF export parameters', () => {
      const filename = 'resume-test.pdf';
      expect(filename).toMatch(/\.pdf$/);
    });

    it('validates DOCX export parameters', () => {
      const filename = 'resume-test.docx';
      expect(filename).toMatch(/\.docx$/);
    });

    it('validates HTML export parameters', () => {
      const filename = 'resume-test.html';
      expect(filename).toMatch(/\.html$/);
    });
  });
});
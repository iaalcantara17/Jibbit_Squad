import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { CoverLetterExportExtended } from '@/components/cover-letters/CoverLetterExportExtended';

describe('CoverLetterExportExtended - Negative Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('uses default subject when role and company missing', async () => {
    const user = userEvent.setup();
    let emlContent = '';
    
    vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      blob.text().then(text => { emlContent = text; });
      return 'blob:mock-url';
    });

    render(
      <CoverLetterExportExtended
        content="Sample content"
        companyName=""
        jobTitle=""
      />
    );

    const emlButton = screen.getByText(/download \.eml/i);
    await user.click(emlButton);

    // Wait for async blob.text()
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(emlContent).toContain('Subject: Application Cover Letter');
  });

  it('handles missing company name in .eml fallback', async () => {
    const user = userEvent.setup();
    let emlContent = '';
    
    vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      blob.text().then(text => { emlContent = text; });
      return 'blob:mock-url';
    });

    render(
      <CoverLetterExportExtended
        content="Sample content"
        companyName={undefined}
        jobTitle="Engineer"
      />
    );

    const emlButton = screen.getByText(/download \.eml/i);
    await user.click(emlButton);

    await new Promise(resolve => setTimeout(resolve, 10));

    // Should use fallback greeting
    expect(emlContent).toContain('Dear Hiring Manager');
  });

  it('handles missing job title in filename', async () => {
    const user = userEvent.setup();
    let downloadedFilename = '';
    
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const element = document.createElement(tag);
      if (tag === 'a') {
        Object.defineProperty(element, 'download', {
          set: (value) => { downloadedFilename = value; },
          get: () => downloadedFilename,
        });
      }
      return element;
    });

    render(
      <CoverLetterExportExtended
        content="Test"
        companyName="TechCorp"
        jobTitle=""
      />
    );

    const emlButton = screen.getByText(/download \.eml/i);
    await user.click(emlButton);

    // Should still generate valid filename
    expect(downloadedFilename).toMatch(/CoverLetter_TechCorp.*\.eml/);
  });
});

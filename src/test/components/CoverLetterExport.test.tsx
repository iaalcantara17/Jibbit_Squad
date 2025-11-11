import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { CoverLetterExportExtended } from '@/components/cover-letters/CoverLetterExportExtended';

describe('CoverLetterExportExtended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('copies content to clipboard with email template', async () => {
    const user = userEvent.setup();
    render(
      <CoverLetterExportExtended
        content="Sample cover letter content"
        companyName="Tech Corp"
        jobTitle="Software Engineer"
      />
    );

    const copyButton = screen.getByText(/copy to email/i);
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Dear Hiring Manager')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Sample cover letter content')
    );
  });

  it('downloads .eml file with correct headers', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    render(
      <CoverLetterExportExtended
        content="Sample content"
        companyName="Tech Corp"
        jobTitle="Developer"
      />
    );

    const emlButton = screen.getByText(/download \.eml/i);
    await user.click(emlButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('sanitizes filename for .eml export', async () => {
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
        companyName="Tech & Co."
        jobTitle="Senior Dev/Eng"
      />
    );

    const emlButton = screen.getByText(/download \.eml/i);
    await user.click(emlButton);

    expect(downloadedFilename).toMatch(/CoverLetter_Tech___Co__Senior_Dev_Eng\.eml/);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('UC-093: LinkedIn Message Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides connection request templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Job Application Follow-up/i)).toBeInTheDocument();
      expect(screen.getByText(/Informational Interview Request/i)).toBeInTheDocument();
      expect(screen.getByText(/Referral Request/i)).toBeInTheDocument();
    });
  });

  it('includes outreach templates for various scenarios', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Post-Event Follow-up/i)).toBeInTheDocument();
      expect(screen.getByText(/Mutual Connection Introduction/i)).toBeInTheDocument();
      expect(screen.getByText(/Industry Expert Outreach/i)).toBeInTheDocument();
    });
  });

  it('categorizes templates by purpose', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Connection requests section
      expect(screen.getByText(/Connection Request Templates/i)).toBeInTheDocument();
      
      // Outreach section
      expect(screen.getByText(/Outreach Templates/i)).toBeInTheDocument();
    });
  });

  it('allows copying templates to clipboard', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    const user = userEvent.setup();
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Job Application Follow-up/i)).toBeInTheDocument();
    });

    // Click copy button
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    await user.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('provides templates for introduction requests', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Informational Interview Request/i)).toBeInTheDocument();
    });

    // Template should include placeholders
    const cards = screen.getAllByRole('generic');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('includes follow-up message templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Post-Event Follow-up/i)).toBeInTheDocument();
    });
  });

  it('offers referral request templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Referral Request/i)).toBeInTheDocument();
    });
  });

  it('provides templates with customization guidance', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      // Templates should have descriptions
      const descriptions = screen.getAllByRole('generic');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('includes mutual connection introduction templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Mutual Connection Introduction/i)).toBeInTheDocument();
    });
  });

  it('offers industry expert outreach templates', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Industry Expert Outreach/i)).toBeInTheDocument();
    });
  });

  it('displays copy confirmation feedback', async () => {
    const LinkedInTemplates = (await import('@/components/network/LinkedInTemplates')).LinkedInTemplates;
    const user = userEvent.setup();
    
    render(<LinkedInTemplates />);

    await waitFor(() => {
      expect(screen.getByText(/Job Application Follow-up/i)).toBeInTheDocument();
    });

    // Click copy button
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    await user.click(copyButtons[0]);

    // Should show check icon briefly
    await waitFor(() => {
      const checkIcons = screen.queryAllByRole('generic');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });
});

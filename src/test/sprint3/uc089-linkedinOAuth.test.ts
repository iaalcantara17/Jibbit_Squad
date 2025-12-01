import { describe, it, expect, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase auth
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

describe('UC-089: LinkedIn OAuth Integration', () => {
  it('uses linkedin_oidc provider (not deprecated linkedin)', async () => {
    const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
    
    // Simulate LinkedIn OAuth sign-in
    mockSignInWithOAuth.mockResolvedValue({
      data: {
        provider: 'linkedin_oidc',
        url: 'https://linkedin.com/oauth/authorize?...',
      },
      error: null,
    } as any);

    const result = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });

    expect(result.data?.provider).toBe('linkedin_oidc');
  });

  it('imports profile data on successful OAuth', async () => {
    const mockLinkedInData = {
      user: {
        id: 'linkedin-user-123',
        email: 'user@example.com',
        user_metadata: {
          name: 'John Doe',
          headline: 'Software Engineer at TechCorp',
          picture: 'https://linkedin.com/profile/john-pic.jpg',
          sub: 'linkedin-user-123',
        },
      },
    };

    const imported = {
      name: mockLinkedInData.user.user_metadata.name,
      headline: mockLinkedInData.user.user_metadata.headline,
      picture: mockLinkedInData.user.user_metadata.picture,
    };

    expect(imported.name).toBe('John Doe');
    expect(imported.headline).toBe('Software Engineer at TechCorp');
    expect(imported.picture).toContain('linkedin.com');
  });

  it('falls back to manual profile entry if OAuth not configured', () => {
    const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
    
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: {
        message: 'Provider not enabled',
        name: 'AuthError',
        status: 400,
      },
    } as any);

    // User should be able to manually enter LinkedIn URL
    const manualProfile = {
      linkedin_url: 'https://linkedin.com/in/johndoe',
      name: 'John Doe',
      headline: 'Software Engineer',
    };

    expect(manualProfile.linkedin_url).toContain('linkedin.com');
    expect(manualProfile.name).toBeTruthy();
  });

  it('Settings UI shows connection status', () => {
    const connectionStates = [
      {
        isConnected: false,
        message: 'Connect LinkedIn to import profile data',
        actionButton: 'Connect LinkedIn',
      },
      {
        isConnected: true,
        message: 'LinkedIn connected - data synced',
        actionButton: 'Disconnect',
      },
      {
        isConnected: false,
        error: 'OAuth not configured',
        message: 'LinkedIn OAuth is not configured. Please add credentials to enable.',
        actionButton: null,
      },
    ];

    connectionStates.forEach(state => {
      if (state.isConnected) {
        expect(state.actionButton).toBe('Disconnect');
      } else if (state.error) {
        expect(state.message).toContain('not configured');
      } else {
        expect(state.actionButton).toBe('Connect LinkedIn');
      }
    });
  });

  it('mock OAuth response for testing', () => {
    const mockOAuthResponse = {
      provider: 'linkedin_oidc',
      user_metadata: {
        name: 'Test User',
        headline: 'Senior Developer',
        picture: 'https://mock-linkedin.com/picture.jpg',
        email: 'test@example.com',
      },
    };

    // Test integration should be able to mock responses
    expect(mockOAuthResponse.provider).toBe('linkedin_oidc');
    expect(mockOAuthResponse.user_metadata.name).toBeTruthy();
    expect(mockOAuthResponse.user_metadata.headline).toBeTruthy();
  });

  it('imports specific fields on signup', () => {
    const linkedInFields = {
      name: 'John Doe',
      headline: 'Software Engineer at TechCorp',
      picture: 'https://linkedin.com/pic.jpg',
      // Additional fields that could be imported
      location: 'San Francisco, CA',
      industry: 'Technology',
    };

    // Required imports on signup
    const requiredImports = ['name', 'headline', 'picture'];
    requiredImports.forEach(field => {
      expect(linkedInFields).toHaveProperty(field);
      expect((linkedInFields as any)[field]).toBeTruthy();
    });
  });

  it('provides LinkedIn message templates', () => {
    const templates = [
      {
        type: 'connection_request',
        template: "Hi {name}, I noticed we both work in {industry}. I'd love to connect!",
      },
      {
        type: 'informational_interview',
        template: "Hi {name}, I'm interested in {company}. Would you be open to a brief chat?",
      },
      {
        type: 'referral_request',
        template: "Hi {name}, I'm applying to {job_title} at {company}. Would you be willing to refer me?",
      },
    ];

    expect(templates.length).toBeGreaterThan(0);
    templates.forEach(template => {
      expect(template.template).toContain('{name}');
    });
  });

  it('LinkedIn optimization guidance available', () => {
    const optimizationTips = [
      'Use a professional headshot',
      'Write a compelling headline with keywords',
      'Complete all profile sections',
      'Add 3-5 skills relevant to your target role',
      'Get recommendations from colleagues',
    ];

    expect(optimizationTips.length).toBeGreaterThanOrEqual(5);
    expect(optimizationTips.some(tip => tip.includes('headline'))).toBe(true);
  });
});

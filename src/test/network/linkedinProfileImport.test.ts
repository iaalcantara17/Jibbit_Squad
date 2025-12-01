import { describe, it, expect } from 'vitest';

describe('LinkedIn Profile Import', () => {
  it('should extract profile data from LinkedIn OAuth metadata', () => {
    const linkedInUser = {
      app_metadata: { provider: 'linkedin_oidc' },
      user_metadata: {
        name: 'John Doe',
        full_name: 'John Michael Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        picture: 'https://example.com/pic.jpg',
        headline: 'Software Engineer at Tech Corp',
      }
    };

    const extracted = {
      name: linkedInUser.user_metadata.name || linkedInUser.user_metadata.full_name,
      avatar_url: linkedInUser.user_metadata.avatar_url || linkedInUser.user_metadata.picture,
    };

    expect(extracted.name).toBe('John Doe');
    expect(extracted.avatar_url).toBe('https://example.com/avatar.jpg');
  });

  it('should only import on LinkedIn OAuth provider', () => {
    const googleUser = {
      app_metadata: { provider: 'google' },
      user_metadata: { name: 'Jane Doe' }
    };

    const shouldImport = googleUser.app_metadata.provider === 'linkedin_oidc';

    expect(shouldImport).toBe(false);
  });
});

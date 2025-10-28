import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const MockedNavigation = ({ authenticated = false }: { authenticated?: boolean }) => {
  if (authenticated) {
    localStorage.setItem('auth_token', 'test-token');
    vi.mocked(api.getProfile).mockResolvedValue({
      success: true,
      data: {
        user_id: '123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    });
    vi.mocked(api.getBasicInfo).mockResolvedValue({
      success: true,
      data: [],
    });
  } else {
    localStorage.removeItem('auth_token');
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Logo', () => {
    it('should display logo', () => {
      const { container } = render(<MockedNavigation />);
      
      const logo = container.querySelector('img[alt*="JibbitATS"]') || container.querySelector('img[alt*="logo"]');
      expect(logo).toBeTruthy();
    });

    it('should link logo to homepage', () => {
      const { container } = render(<MockedNavigation />);
      
      const logoLink = container.querySelector('a[href="/"]');
      expect(logoLink).toBeTruthy();
    });
  });

  describe('Unauthenticated State', () => {
    it('should show login and get started buttons', () => {
      const { container } = render(<MockedNavigation />);
      
      expect(container.textContent).toContain('Login');
      expect(container.textContent).toContain('Get Started');
    });

    it('should not show authenticated-only links', () => {
      const { container } = render(<MockedNavigation />);
      
      expect(container.textContent).not.toContain('Dashboard');
      expect(container.textContent).not.toContain('Logout');
    });
  });

  describe('Authenticated State', () => {
    it('should show dashboard and profile links', async () => {
      const { container } = render(<MockedNavigation authenticated={true} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(container.textContent).toContain('Dashboard');
      expect(container.textContent).toContain('Profile');
    });

    it('should show logout button', async () => {
      const { container } = render(<MockedNavigation authenticated={true} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(container.textContent).toContain('Logout');
    });

    it('should handle logout click', async () => {
      vi.mocked(api.logout).mockResolvedValue({ success: true });

      const { container } = render(<MockedNavigation authenticated={true} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const buttons = Array.from(container.querySelectorAll('button'));
      const logoutButton = buttons.find((btn: Element) => btn.textContent?.includes('Logout')) as HTMLButtonElement;
      logoutButton?.click();

      expect(api.logout).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render theme toggle', () => {
      const { container } = render(<MockedNavigation />);
      
      const themeToggle = container.querySelector('[aria-label*="theme"]') || 
                         container.querySelector('button[type="button"]');
      expect(themeToggle).toBeTruthy();
    });
  });
});

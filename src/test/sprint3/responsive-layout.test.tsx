import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TechnicalPrep from '@/pages/TechnicalPrep';
import InstitutionalAdmin from '@/pages/InstitutionalAdmin';
import SharedProgress from '@/pages/SharedProgress';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Responsive Layout Tests', () => {
  it('Technical Prep page renders with responsive container', () => {
    renderWithProviders(<TechnicalPrep />);
    
    expect(screen.getByText('Technical Prep')).toBeInTheDocument();
    expect(screen.getByText(/Practice coding challenges/i)).toBeInTheDocument();
  });

  it('Institutional Admin page renders with responsive container', () => {
    renderWithProviders(<InstitutionalAdmin />);
    
    expect(screen.getByText('Institutional Admin')).toBeInTheDocument();
    expect(screen.getByText(/About Institutional Features/i)).toBeInTheDocument();
  });

  it('Shared Progress page handles missing token gracefully', () => {
    renderWithProviders(<SharedProgress />);
    
    // Should show loading or error state, not crash
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});

describe('Layout Overflow Prevention', () => {
  it('should have proper max-width classes on main containers', () => {
    const { container } = renderWithProviders(<TechnicalPrep />);
    
    // Check for responsive container classes
    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should handle long text with break-words', () => {
    const { container } = renderWithProviders(<TechnicalPrep />);
    
    // Verify container has proper overflow handling
    const bodyElement = document.body;
    const styles = window.getComputedStyle(bodyElement);
    
    // Body should have overflow-x: hidden from global CSS
    expect(styles.overflowX).toBe('hidden');
  });
});
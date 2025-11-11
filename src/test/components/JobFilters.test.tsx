import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { JobFilters } from '@/components/jobs/JobFilters';
import { JobFilters as JobFiltersType } from '@/types/jobs';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

describe('JobFilters', () => {
  const mockFilters: JobFiltersType = {
    isArchived: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const mockOnFiltersChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  it('renders search input', () => {
    const { getByPlaceholderText } = render(
      <JobFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(getByPlaceholderText(/search jobs/i)).toBeInTheDocument();
  });

  it('renders Filters button', () => {
    const { getByText } = render(
      <JobFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(getByText('Filters')).toBeInTheDocument();
  });

  it('renders Saved Searches button', () => {
    const { getByText } = render(
      <JobFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(getByText('Saved Searches')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    const { getByPlaceholderText } = render(
      <JobFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const searchInput = getByPlaceholderText(/search jobs/i) as HTMLInputElement;
    searchInput.value = 'Software Engineer';
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('shows active filter indicator when filters are applied', () => {
    const filtersWithSearch: JobFiltersType = {
      ...mockFilters,
      search: 'test',
    };

    const { container } = render(
      <JobFilters
        filters={filtersWithSearch}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Check for the indicator element (small dot)
    const indicator = container.querySelector('.bg-primary');
    expect(indicator).toBeInTheDocument();
  });
});

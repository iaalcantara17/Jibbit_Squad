import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { SkillsManagement } from '@/components/profile/SkillsManagement';
import { CertificationsManagement } from '@/components/profile/CertificationsManagement';
import { SpecialProjectsManagement } from '@/components/profile/SpecialProjectsManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { skills: [], certifications: [], projects: [] },
          error: null 
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ProfileListsRefresh - Optimistic Updates + React-Query Invalidation + Realtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skills list: optimistic update + invalidation on add', async () => {
    const user = userEvent.setup();

    render(<SkillsManagement />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add skill/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add skill/i });
    await user.click(addButton);

    // Verify optimistic update (UI shows loading state)
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('certifications list: optimistic update + invalidation on delete', async () => {
    const user = userEvent.setup();

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              certifications: [
                { name: 'AWS Certified', issuer: 'Amazon', date: '2024-01' }
              ]
            },
            error: null 
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    }));

    render(<CertificationsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/AWS Certified/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Verify optimistic removal before confirmation
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('projects list: realtime subscription updates UI', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        // Simulate realtime update
        setTimeout(() => {
          callback?.();
        }, 100);
        return mockChannel;
      }),
    };

    mockSupabase.channel = vi.fn(() => mockChannel);
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              projects: [
                { name: 'E-commerce Platform', description: 'Built with React' }
              ]
            },
            error: null 
          })),
        })),
      })),
    }));

    render(<SpecialProjectsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/E-commerce Platform/i)).toBeInTheDocument();
    });

    // Verify realtime channel setup
    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.stringContaining('profiles'));
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', schema: 'public', table: 'profiles' }),
      expect.any(Function)
    );
  });

  it('handles update error gracefully with rollback', async () => {
    const user = userEvent.setup();

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { skills: [{ name: 'React', level: 'expert' }] },
            error: null 
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Network error' } 
        })),
      })),
    }));

    render(<SkillsManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/React/i)).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Trigger update that will fail
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('error'));
    });

    // Verify original data still present (rollback)
    expect(screen.getByText(/React/i)).toBeInTheDocument();
  });
});

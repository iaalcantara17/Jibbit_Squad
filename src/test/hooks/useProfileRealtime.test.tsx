import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfileRealtime } from '@/hooks/useProfileRealtime';
import { supabase } from '@/integrations/supabase/client';

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: any) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useProfileRealtime Hook (Bug #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to profile changes for the given user', () => {
    renderHook(() => useProfileRealtime('user-123'), { wrapper: createWrapper() });

    expect(supabase.channel).toHaveBeenCalledWith('profile-changes');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'user_id=eq.user-123',
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('does not subscribe when userId is undefined', () => {
    renderHook(() => useProfileRealtime(undefined), { wrapper: createWrapper() });

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('invalidates profile queries when profile changes', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = function Wrapper({ children }: any) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    renderHook(() => useProfileRealtime('user-123'), { wrapper });

    // Get the callback function passed to .on()
    const onCallback = mockChannel.on.mock.calls[0][2];

    // Simulate a profile change event
    onCallback({ eventType: 'UPDATE', new: { user_id: 'user-123' } });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile', 'user-123'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profileSkills', 'user-123'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profileCertifications', 'user-123'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profileProjects', 'user-123'] });
    });
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useProfileRealtime('user-123'), { wrapper: createWrapper() });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('resubscribes when userId changes', () => {
    const { rerender } = renderHook(
      ({ userId }) => useProfileRealtime(userId),
      {
        wrapper: createWrapper(),
        initialProps: { userId: 'user-123' },
      }
    );

    expect(supabase.channel).toHaveBeenCalledTimes(1);

    // Change userId
    rerender({ userId: 'user-456' });

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    expect(supabase.channel).toHaveBeenCalledTimes(2);
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        filter: 'user_id=eq.user-456',
      }),
      expect.any(Function)
    );
  });

  it('handles all event types (*)', () => {
    renderHook(() => useProfileRealtime('user-123'), { wrapper: createWrapper() });

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*', // Should listen to all events
      }),
      expect.any(Function)
    );
  });

  it('logs profile change detection', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    renderHook(() => useProfileRealtime('user-123'), { wrapper: createWrapper() });

    const onCallback = mockChannel.on.mock.calls[0][2];
    const mockPayload = { eventType: 'INSERT', new: { user_id: 'user-123' } };

    onCallback(mockPayload);

    expect(consoleSpy).toHaveBeenCalledWith('Profile change detected:', mockPayload);

    consoleSpy.mockRestore();
  });
});

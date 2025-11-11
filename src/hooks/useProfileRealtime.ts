import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to enable Realtime subscriptions for profile-related tables
 * Automatically invalidates React Query caches when profile data changes
 */
export function useProfileRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to profiles table changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          
          // Invalidate all profile-related queries
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
          queryClient.invalidateQueries({ queryKey: ['profileSkills', userId] });
          queryClient.invalidateQueries({ queryKey: ['profileCertifications', userId] });
          queryClient.invalidateQueries({ queryKey: ['profileProjects', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

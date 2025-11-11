import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProfileData = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateProfileField = async (field: string, data: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: data })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    updateProfileField,
  };
};

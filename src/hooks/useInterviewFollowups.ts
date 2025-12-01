// Sprint 3: Interview Followups Hook
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  InterviewFollowup,
  InterviewFollowupInsert,
  InterviewFollowupUpdate,
  FollowupType,
} from '@/types/interviews';
import {
  getInterviewFollowups,
  createInterviewFollowup,
  updateInterviewFollowup,
  deleteInterviewFollowup,
  markFollowupAsSent,
} from '@/lib/api/interviews';

export const useInterviewFollowups = (interviewId: string) => {
  const { user } = useAuth();
  const [followups, setFollowups] = useState<InterviewFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && interviewId) {
      loadFollowups();
    }
  }, [user, interviewId]);

  const loadFollowups = async () => {
    if (!user || !interviewId) return;

    try {
      setLoading(true);
      const data = await getInterviewFollowups(interviewId);
      setFollowups(data);
    } catch (error) {
      console.error('Error loading interview followups:', error);
      toast.error('Failed to load followups');
    } finally {
      setLoading(false);
    }
  };

  const addFollowup = async (
    followupData: Omit<InterviewFollowupInsert, 'user_id' | 'interview_id'>
  ) => {
    if (!user) return null;

    try {
      const data = await createInterviewFollowup({
        ...followupData,
        interview_id: interviewId,
        user_id: user.id,
      });

      toast.success('Followup created');
      await loadFollowups();
      return data;
    } catch (error) {
      console.error('Error creating followup:', error);
      toast.error('Failed to create followup');
      return null;
    }
  };

  const updateFollowup = async (id: string, updates: InterviewFollowupUpdate) => {
    try {
      await updateInterviewFollowup(id, updates);
      toast.success('Followup updated');
      await loadFollowups();
    } catch (error) {
      console.error('Error updating followup:', error);
      toast.error('Failed to update followup');
    }
  };

  const deleteFollowup = async (id: string) => {
    try {
      await deleteInterviewFollowup(id);
      toast.success('Followup deleted');
      await loadFollowups();
    } catch (error) {
      console.error('Error deleting followup:', error);
      toast.error('Failed to delete followup');
    }
  };

  const markAsSent = async (id: string) => {
    try {
      await markFollowupAsSent(id);
      toast.success('Followup marked as sent');
      await loadFollowups();
    } catch (error) {
      console.error('Error marking followup as sent:', error);
      toast.error('Failed to update followup status');
    }
  };

  const getFollowupsByType = (type: FollowupType) => {
    return followups.filter((followup) => followup.type === type);
  };

  const getPendingFollowups = () => {
    return followups.filter(
      (followup) => followup.status === 'draft' || followup.status === 'scheduled'
    );
  };

  return {
    followups,
    loading,
    addFollowup,
    updateFollowup,
    deleteFollowup,
    markAsSent,
    refresh: loadFollowups,
    getFollowupsByType,
    getPendingFollowups,
  };
};

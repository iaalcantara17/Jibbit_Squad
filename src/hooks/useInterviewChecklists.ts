// Sprint 3: Interview Checklists Hook
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  InterviewChecklist,
  InterviewChecklistInsert,
  InterviewChecklistUpdate,
} from '@/types/interviews';
import {
  getInterviewChecklists,
  createInterviewChecklist,
  updateInterviewChecklist,
  deleteInterviewChecklist,
  toggleChecklistItem,
} from '@/lib/api/interviews';

export const useInterviewChecklists = (interviewId: string) => {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<InterviewChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && interviewId) {
      loadChecklists();
    }
  }, [user, interviewId]);

  const loadChecklists = async () => {
    if (!user || !interviewId) return;

    try {
      setLoading(true);
      const data = await getInterviewChecklists(interviewId);
      setChecklists(data);
    } catch (error) {
      console.error('Error loading interview checklists:', error);
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const addChecklist = async (
    checklistData: Omit<InterviewChecklistInsert, 'user_id' | 'interview_id'>
  ) => {
    if (!user) return null;

    try {
      const data = await createInterviewChecklist({
        ...checklistData,
        interview_id: interviewId,
        user_id: user.id,
      });

      toast.success('Checklist item added');
      await loadChecklists();
      return data;
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast.error('Failed to add checklist item');
      return null;
    }
  };

  const updateChecklistItem = async (
    id: string,
    updates: InterviewChecklistUpdate
  ) => {
    try {
      await updateInterviewChecklist(id, updates);
      toast.success('Checklist item updated');
      await loadChecklists();
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const deleteChecklistItem = async (id: string) => {
    try {
      await deleteInterviewChecklist(id);
      toast.success('Checklist item deleted');
      await loadChecklists();
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Failed to delete checklist item');
    }
  };

  const toggleItem = async (id: string, completed: boolean) => {
    try {
      await toggleChecklistItem(id, completed);
      await loadChecklists();
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const getCompletionStats = () => {
    const total = checklists.length;
    const completed = checklists.filter((item) => item.completed_at).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  return {
    checklists,
    loading,
    addChecklist,
    updateChecklistItem,
    deleteChecklistItem,
    toggleItem,
    refresh: loadChecklists,
    stats: getCompletionStats(),
  };
};

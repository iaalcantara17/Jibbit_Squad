import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Interview } from '@/types/interviews';

// Legacy interface for backwards compatibility (deprecated, use Interview from types/interviews.ts)
interface LegacyInterview {
  id: string;
  job_id: string;
  interview_type: string;
  interview_date: string;
  location?: string;
  interviewer_name?: string;
  interviewer_role?: string;
  notes?: string;
  calendar_event_id?: string;
}

export const useInterviews = (jobId?: string) => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInterviews();
    }
  }, [user, jobId]);

  const loadInterviews = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('interview_date', { ascending: true });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const createInterview = async (interviewData: {
    job_id: string;
    interview_type: string;
    interview_date: string;
    location?: string;
    interviewer_name?: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          user_id: user.id,
          ...interviewData,
        })
        .select()
        .single();

      if (error) throw error;

      // Check if calendar is connected
      const { data: calendarIntegration } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      // If calendar is connected, sync the event
      if (calendarIntegration?.access_token) {
        try {
          // Get job details for calendar event
          const { data: job } = await supabase
            .from('jobs')
            .select('job_title, company_name')
            .eq('id', interviewData.job_id)
            .single();

          const interviewDateTime = new Date(interviewData.interview_date);
          const endTime = new Date(interviewDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

          const { data: calendarData, error: calendarError } = await supabase.functions.invoke('calendar-sync', {
            body: {
              action: 'create',
              event: {
                interviewId: data.id,
                title: `Interview: ${job?.job_title} at ${job?.company_name}`,
                description: `${interviewData.interview_type} interview\n\n${interviewData.notes || ''}`,
                startTime: interviewDateTime.toISOString(),
                endTime: endTime.toISOString(),
                location: interviewData.location,
              },
            },
          });

          if (!calendarError && calendarData?.eventId) {
            // Update interview with calendar event ID
            await supabase
              .from('interviews')
              .update({ calendar_event_id: calendarData.eventId })
              .eq('id', data.id);

            toast.success('Interview scheduled and added to Google Calendar');
          } else {
            toast.success('Interview scheduled');
          }
        } catch (calendarError) {
          console.error('Calendar sync error:', calendarError);
          toast.success('Interview scheduled (calendar sync failed)');
        }
      } else {
        toast.success('Interview scheduled');
      }

      await loadInterviews();
      return data;
    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error('Failed to schedule interview');
      return null;
    }
  };

  const updateInterview = async (
    id: string,
    interviewData: {
      interview_type?: string;
      interview_date?: string;
      location?: string;
      interviewer_name?: string;
      notes?: string;
    },
    calendarEventId?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interviews')
        .update(interviewData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If calendar is connected and interview has a calendar event, update it
      if (calendarEventId && interviewData.interview_date) {
        try {
          // Get job details for calendar event
          const { data: interview } = await supabase
            .from('interviews')
            .select('job_id')
            .eq('id', id)
            .single();

          if (interview?.job_id) {
            const { data: job } = await supabase
              .from('jobs')
              .select('job_title, company_name')
              .eq('id', interview.job_id)
              .single();

            const interviewDateTime = new Date(interviewData.interview_date);
            const endTime = new Date(interviewDateTime.getTime() + 60 * 60 * 1000);

            const { error: calendarError } = await supabase.functions.invoke('calendar-sync', {
              body: {
                action: 'update',
                event: {
                  eventId: calendarEventId,
                  event: {
                    title: `Interview: ${job?.job_title} at ${job?.company_name}`,
                    description: `${interviewData.interview_type || data.interview_type} interview\n\n${interviewData.notes || data.notes || ''}`,
                    startTime: interviewDateTime.toISOString(),
                    endTime: endTime.toISOString(),
                    location: interviewData.location || data.location,
                  },
                },
              },
            });

            if (!calendarError) {
              toast.success('Interview updated and calendar synced');
            } else {
              toast.success('Interview updated (calendar sync failed)');
            }
          }
        } catch (calendarError) {
          console.error('Calendar sync error:', calendarError);
          toast.success('Interview updated (calendar sync failed)');
        }
      } else {
        toast.success('Interview updated');
      }

      await loadInterviews();
      return data;
    } catch (error) {
      console.error('Error updating interview:', error);
      toast.error('Failed to update interview');
      return null;
    }
  };

  const deleteInterview = async (id: string, calendarEventId?: string) => {
    if (!user) return;

    try {
      // Delete from calendar if synced
      if (calendarEventId) {
        await supabase.functions.invoke('calendar-sync', {
          body: {
            action: 'delete',
            event: { eventId: calendarEventId },
          },
        });
      }

      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Interview deleted');
      await loadInterviews();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('Failed to delete interview');
    }
  };

  return {
    interviews,
    loading,
    createInterview,
    updateInterview,
    deleteInterview,
    refresh: loadInterviews,
  };
};

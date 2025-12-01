// Sprint 3: Interview API helpers
// Database query helpers for interview-related operations

import { supabase } from '@/integrations/supabase/client';
import {
  InterviewChecklist,
  InterviewChecklistInsert,
  InterviewChecklistUpdate,
  InterviewFollowup,
  InterviewFollowupInsert,
  InterviewFollowupUpdate,
} from '@/types/interviews';

// ============================================
// Interview Checklists
// ============================================

export async function getInterviewChecklists(interviewId: string) {
  const { data, error } = await supabase
    .from('interview_checklists')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as InterviewChecklist[];
}

export async function createInterviewChecklist(checklist: InterviewChecklistInsert) {
  const { data, error } = await supabase
    .from('interview_checklists')
    .insert(checklist)
    .select()
    .single();

  if (error) throw error;
  return data as InterviewChecklist;
}

export async function updateInterviewChecklist(
  id: string,
  updates: InterviewChecklistUpdate
) {
  const { data, error } = await supabase
    .from('interview_checklists')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterviewChecklist;
}

export async function deleteInterviewChecklist(id: string) {
  const { error } = await supabase
    .from('interview_checklists')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleChecklistItem(id: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;
  
  return updateInterviewChecklist(id, { completed_at: completedAt });
}

// ============================================
// Interview Followups
// ============================================

export async function getInterviewFollowups(interviewId: string) {
  const { data, error } = await supabase
    .from('interview_followups')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InterviewFollowup[];
}

export async function createInterviewFollowup(followup: InterviewFollowupInsert) {
  const { data, error } = await supabase
    .from('interview_followups')
    .insert(followup)
    .select()
    .single();

  if (error) throw error;
  return data as InterviewFollowup;
}

export async function updateInterviewFollowup(
  id: string,
  updates: InterviewFollowupUpdate
) {
  const { data, error } = await supabase
    .from('interview_followups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterviewFollowup;
}

export async function deleteInterviewFollowup(id: string) {
  const { error } = await supabase
    .from('interview_followups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markFollowupAsSent(id: string) {
  return updateInterviewFollowup(id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}

// ============================================
// Combined Queries
// ============================================

export async function getInterviewWithDetails(interviewId: string) {
  // Get interview
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .select('*, jobs(id, job_title, company_name)')
    .eq('id', interviewId)
    .single();

  if (interviewError) throw interviewError;

  // Get checklists
  const checklists = await getInterviewChecklists(interviewId);

  // Get followups
  const followups = await getInterviewFollowups(interviewId);

  return {
    ...interview,
    checklists,
    followups,
  };
}

export async function getUserInterviewsWithJobs(userId: string) {
  const { data, error } = await supabase
    .from('interviews')
    .select('*, jobs(id, job_title, company_name, status)')
    .eq('user_id', userId)
    .order('scheduled_start', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function getUpcomingInterviews(userId: string) {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('interviews')
    .select('*, jobs(id, job_title, company_name)')
    .eq('user_id', userId)
    .gte('scheduled_start', now)
    .eq('status', 'scheduled')
    .order('scheduled_start', { ascending: true });

  if (error) throw error;
  return data;
}

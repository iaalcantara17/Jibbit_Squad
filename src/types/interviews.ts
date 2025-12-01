// Sprint 3: Interview Data Types
// Extends existing interviews table with new columns and related tables

import { Database } from '@/integrations/supabase/types';

// Base interview type from database
export type Interview = Database['public']['Tables']['interviews']['Row'];
export type InterviewInsert = Database['public']['Tables']['interviews']['Insert'];
export type InterviewUpdate = Database['public']['Tables']['interviews']['Update'];

// Interview outcome enum
export type InterviewOutcome = 'pending' | 'pass' | 'fail' | 'offer' | 'unknown';

// Interview status enum (existing, documented here for reference)
export type InterviewStatus = 'scheduled' | 'completed' | 'canceled';

// Interview format/type (existing as interview_type)
export type InterviewFormat = 'onsite' | 'remote' | 'phone' | 'video';

// Interview checklist item
export interface InterviewChecklist {
  id: string;
  interview_id: string;
  user_id: string;
  label: string;
  category?: string;
  is_required: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewChecklistInsert {
  interview_id: string;
  user_id: string;
  label: string;
  category?: string;
  is_required?: boolean;
  completed_at?: string;
}

export interface InterviewChecklistUpdate {
  label?: string;
  category?: string;
  is_required?: boolean;
  completed_at?: string;
}

// Interview followup types
export type FollowupType = 'thank_you' | 'status_check' | 'feedback_request' | 'network_followup';
export type FollowupStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface InterviewFollowup {
  id: string;
  interview_id: string;
  user_id: string;
  type: FollowupType;
  template_subject?: string;
  template_body?: string;
  sent_at?: string;
  status: FollowupStatus;
  created_at: string;
  updated_at: string;
}

export interface InterviewFollowupInsert {
  interview_id: string;
  user_id: string;
  type: FollowupType;
  template_subject?: string;
  template_body?: string;
  sent_at?: string;
  status?: FollowupStatus;
}

export interface InterviewFollowupUpdate {
  type?: FollowupType;
  template_subject?: string;
  template_body?: string;
  sent_at?: string;
  status?: FollowupStatus;
}

// Extended interview with related data
export interface InterviewWithDetails extends Interview {
  checklists?: InterviewChecklist[];
  followups?: InterviewFollowup[];
  job?: {
    id: string;
    job_title: string;
    company_name: string;
  };
}

// Helper function to calculate interview end time from start + duration
export function calculateInterviewEnd(
  scheduledStart: string | null,
  durationMinutes: number | null
): string | null {
  if (!scheduledStart || !durationMinutes) return null;
  
  const start = new Date(scheduledStart);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toISOString();
}

// Helper to check if interview is upcoming
export function isUpcomingInterview(interview: Interview): boolean {
  if (!interview.scheduled_start) return false;
  return new Date(interview.scheduled_start) > new Date();
}

// Helper to check if interview is today
export function isInterviewToday(interview: Interview): boolean {
  if (!interview.scheduled_start) return false;
  
  const today = new Date();
  const interviewDate = new Date(interview.scheduled_start);
  
  return (
    today.getFullYear() === interviewDate.getFullYear() &&
    today.getMonth() === interviewDate.getMonth() &&
    today.getDate() === interviewDate.getDate()
  );
}

// Helper to get outcome badge color
export function getOutcomeBadgeVariant(outcome: InterviewOutcome): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (outcome) {
    case 'pass':
    case 'offer':
      return 'default';
    case 'fail':
      return 'destructive';
    case 'pending':
      return 'secondary';
    case 'unknown':
    default:
      return 'outline';
  }
}

// Helper to get status badge color
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'scheduled':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'canceled':
      return 'destructive';
    default:
      return 'outline';
  }
}

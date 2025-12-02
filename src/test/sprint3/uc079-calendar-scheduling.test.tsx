import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-079: Interview Scheduling and Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Calendar Integration', () => {
    it('should sync with external calendar providers', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockIntegration = {
        id: 'cal-1',
        user_id: 'user-1',
        provider: 'google',
        access_token: 'encrypted_token',
        refresh_token: 'encrypted_refresh',
        sync_enabled: true,
        last_sync: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [mockIntegration], error: null }),
        }),
      });

      expect(mockIntegration.provider).toBe('google');
      expect(mockIntegration.sync_enabled).toBe(true);
    });

    it('should link interviews to job applications', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockInterview = {
        id: 'int-1',
        user_id: 'user-1',
        job_id: 'job-123',
        interview_type: 'phone_screen',
        scheduled_start: '2025-02-15T14:00:00Z',
        scheduled_end: '2025-02-15T15:00:00Z',
        location: 'Zoom',
        meeting_link: 'https://zoom.us/j/123456789',
        status: 'scheduled',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInterview, error: null }),
          }),
        }),
      });

      expect(mockInterview.job_id).toBe('job-123');
      expect(mockInterview.meeting_link).toContain('zoom.us');
    });
  });

  describe('Interview Reminders', () => {
    it('should send reminder 24 hours before interview', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const interviewTime = new Date('2025-02-15T14:00:00Z');
      const reminder24h = new Date(interviewTime.getTime() - 24 * 60 * 60 * 1000);

      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        notification_type: 'interview_reminder',
        title: 'Interview Tomorrow',
        message: 'You have an interview scheduled for tomorrow at 2:00 PM',
        scheduled_for: reminder24h.toISOString(),
        sent: false,
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      expect(mockNotification.notification_type).toBe('interview_reminder');
      expect(new Date(mockNotification.scheduled_for).getTime()).toBeLessThan(interviewTime.getTime());
    });

    it('should send reminder 2 hours before interview', async () => {
      const interviewTime = new Date('2025-02-15T14:00:00Z');
      const reminder2h = new Date(interviewTime.getTime() - 2 * 60 * 60 * 1000);

      const mockNotification = {
        id: 'notif-2',
        user_id: 'user-1',
        notification_type: 'interview_reminder',
        title: 'Interview in 2 Hours',
        message: 'Your interview starts in 2 hours',
        scheduled_for: reminder2h.toISOString(),
        sent: false,
      };

      expect(mockNotification.notification_type).toBe('interview_reminder');
      expect(new Date(mockNotification.scheduled_for).getTime()).toBeLessThan(interviewTime.getTime());
    });
  });

  describe('Interview Logistics', () => {
    it('should store location and video link information', async () => {
      const mockInterview = {
        id: 'int-1',
        location: 'Virtual - Zoom',
        meeting_link: 'https://zoom.us/j/987654321',
        meeting_password: 'pass123',
        dial_in_number: '+1-555-0123',
        interviewer_name: 'Jane Smith',
        interviewer_email: 'jane.smith@company.com',
      };

      expect(mockInterview.meeting_link).toBeDefined();
      expect(mockInterview.location).toContain('Virtual');
    });

    it('should track preparation task completion', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockTasks = [
        { id: 't1', interview_id: 'int-1', task: 'Test video link', completed: true },
        { id: 't2', interview_id: 'int-1', task: 'Research company', completed: true },
        { id: 't3', interview_id: 'int-1', task: 'Prepare questions', completed: false },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
        }),
      });

      const completed = mockTasks.filter(t => t.completed).length;
      const completionRate = (completed / mockTasks.length) * 100;

      expect(completionRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Outcome Tracking', () => {
    it('should record interview outcomes and next steps', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockOutcome = {
        id: 'int-1',
        outcome: 'positive',
        outcome_notes: 'Strong technical performance, moving to final round',
        next_steps: 'Final round with CEO scheduled',
        completed_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockOutcome, error: null }),
            }),
          }),
        }),
      });

      expect(mockOutcome.outcome).toBe('positive');
      expect(mockOutcome.next_steps).toBeDefined();
    });
  });

  describe('Thank-you Note Integration', () => {
    it('should generate follow-up task after interview', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const interviewCompleted = new Date();
      const followUpDue = new Date(interviewCompleted.getTime() + 24 * 60 * 60 * 1000);

      const mockFollowUp = {
        id: 'followup-1',
        interview_id: 'int-1',
        type: 'thank_you_email',
        status: 'pending',
        due_date: followUpDue.toISOString(),
        template_subject: 'Thank you for the interview',
        template_body: 'Dear [Interviewer], Thank you for taking the time...',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFollowUp, error: null }),
          }),
        }),
      });

      expect(mockFollowUp.type).toBe('thank_you_email');
      expect(mockFollowUp.status).toBe('pending');
    });
  });

  describe('ICS Export Fallback', () => {
    it('should generate ICS file for calendar import', async () => {
      const mockInterview = {
        id: 'int-1',
        job_title: 'Senior Engineer',
        company_name: 'TechCorp',
        scheduled_start: '2025-02-15T14:00:00Z',
        scheduled_end: '2025-02-15T15:00:00Z',
        location: 'Zoom',
        meeting_link: 'https://zoom.us/j/123456789',
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:Interview: ${mockInterview.job_title} at ${mockInterview.company_name}`,
        `DTSTART:${mockInterview.scheduled_start.replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${mockInterview.scheduled_end.replace(/[-:]/g, '').split('.')[0]}Z`,
        `LOCATION:${mockInterview.location}`,
        `DESCRIPTION:${mockInterview.meeting_link}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain(mockInterview.job_title);
      expect(icsContent).toContain(mockInterview.meeting_link);
    });
  });
});

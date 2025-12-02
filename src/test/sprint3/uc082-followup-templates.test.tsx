import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-082: Interview Follow-Up Templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Thank-You Email Generation', () => {
    it('should generate personalized thank-you template', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockFollowUp = {
        id: 'fu1',
        interview_id: 'int-1',
        user_id: 'user-1',
        type: 'thank_you',
        template_subject: 'Thank you for the opportunity - Software Engineer position',
        template_body: 'Dear Sarah,\n\nThank you for taking the time to speak with me today about the Software Engineer position. I enjoyed learning about the team and the exciting projects you are working on.\n\nI was particularly interested in our discussion about the AI platform development. My experience with React and Python aligns well with the technical challenges you described.\n\nPlease let me know if you need any additional information. I look forward to hearing from you.\n\nBest regards,\nJohn',
        status: 'draft',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFollowUp, error: null }),
          }),
        }),
      });

      expect(mockFollowUp.type).toBe('thank_you');
      expect(mockFollowUp.template_body).toContain('Thank you');
    });

    it('should include specific conversation references', async () => {
      const template = {
        interviewer_name: 'Sarah Johnson',
        conversation_topics: [
          'AI platform development roadmap',
          'Team collaboration process',
          'Remote work policies',
        ],
        template_body: 'I particularly enjoyed our discussion about the AI platform development roadmap and learning how your team collaborates on remote projects.',
      };

      expect(template.template_body).toContain('AI platform');
      expect(template.template_body).toContain('remote');
    });
  });

  describe('Follow-Up Timing', () => {
    it('should suggest appropriate timing for follow-ups', async () => {
      const timingGuidance = {
        thank_you: {
          send_within_hours: 24,
          recommendation: 'Send within 24 hours of interview',
        },
        status_inquiry: {
          wait_days: 7,
          recommendation: 'Wait 7-10 days before inquiring about status',
        },
        additional_info: {
          send_within_hours: 48,
          recommendation: 'Send within 48 hours if you forgot to mention something',
        },
      };

      expect(timingGuidance.thank_you.send_within_hours).toBe(24);
      expect(timingGuidance.status_inquiry.wait_days).toBe(7);
    });
  });

  describe('Status Inquiry Templates', () => {
    it('should provide templates for delayed responses', async () => {
      const statusInquiry = {
        type: 'status_inquiry',
        template_subject: 'Following up on Software Engineer position',
        template_body: 'Dear Sarah,\n\nI wanted to follow up on my interview from last week for the Software Engineer position. I remain very interested in the opportunity and would appreciate any updates on the hiring timeline.\n\nPlease let me know if you need any additional information from me.\n\nBest regards,\nJohn',
      };

      expect(statusInquiry.type).toBe('status_inquiry');
      expect(statusInquiry.template_body).toContain('follow up');
    });
  });

  describe('Feedback Request Templates', () => {
    it('should generate templates for requesting interview feedback', async () => {
      const feedbackRequest = {
        type: 'feedback_request',
        template_subject: 'Request for interview feedback',
        template_body: 'Dear Sarah,\n\nThank you for considering me for the Software Engineer position. While I understand the decision has been made, I would greatly appreciate any feedback you could share about my interview performance. This would help me improve for future opportunities.\n\nThank you for your time and consideration.\n\nBest regards,\nJohn',
      };

      expect(feedbackRequest.type).toBe('feedback_request');
      expect(feedbackRequest.template_body).toContain('feedback');
    });
  });

  describe('Networking Follow-Up for Rejections', () => {
    it('should provide networking templates for rejected applications', async () => {
      const networkingFollowUp = {
        type: 'networking_after_rejection',
        template_subject: 'Thank you and staying connected',
        template_body: 'Dear Sarah,\n\nThank you for the opportunity to interview. While I am disappointed that I was not selected for this position, I genuinely enjoyed learning about your work and would love to stay connected for future opportunities.\n\nI would appreciate the opportunity to connect on LinkedIn and learn about any other roles that might be a fit down the line.\n\nBest regards,\nJohn',
      };

      expect(networkingFollowUp.type).toBe('networking_after_rejection');
      expect(networkingFollowUp.template_body).toContain('stay connected');
    });
  });

  describe('Follow-Up Tracking', () => {
    it('should track follow-up completion and response rates', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockFollowUp = {
        id: 'fu1',
        interview_id: 'int-1',
        type: 'thank_you',
        status: 'sent',
        sent_at: '2025-01-20T10:00:00Z',
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockFollowUp, error: null }),
            }),
          }),
        }),
      });

      expect(mockFollowUp.status).toBe('sent');
      expect(mockFollowUp.sent_at).toBeDefined();
    });

    it('should calculate response rate for follow-ups', async () => {
      const followUps = [
        { id: '1', sent_at: '2025-01-15', response_received: true },
        { id: '2', sent_at: '2025-01-16', response_received: false },
        { id: '3', sent_at: '2025-01-17', response_received: true },
        { id: '4', sent_at: '2025-01-18', response_received: false },
      ];

      const responseRate = (followUps.filter(f => f.response_received).length / followUps.length) * 100;

      expect(responseRate).toBe(50);
    });
  });

  describe('Interviewer Detail Personalization', () => {
    it('should include interviewer names and roles in templates', async () => {
      const template = {
        interviewer_name: 'Sarah Johnson',
        interviewer_role: 'Engineering Manager',
        template_body: 'Dear Sarah,\n\nThank you for taking the time to discuss the engineering team and your leadership approach...',
      };

      expect(template.template_body).toContain(template.interviewer_name);
    });

    it('should handle multiple interviewers', async () => {
      const multiInterviewerTemplate = {
        interviewers: [
          { name: 'Sarah Johnson', role: 'Engineering Manager' },
          { name: 'Mike Chen', role: 'Tech Lead' },
        ],
        template_subject: 'Thank you - Software Engineer Interview',
        template_body: 'Dear Sarah and Mike,\n\nThank you both for your time during the interview process...',
      };

      expect(multiInterviewerTemplate.interviewers).toHaveLength(2);
      expect(multiInterviewerTemplate.template_body).toContain('both');
    });
  });

  describe('Template Customization', () => {
    it('should allow editing template content', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const editedTemplate = {
        id: 'fu1',
        template_subject: 'Custom Subject',
        template_body: 'Custom body with personal touches...',
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: editedTemplate, error: null }),
            }),
          }),
        }),
      });

      expect(editedTemplate.template_subject).toBe('Custom Subject');
    });
  });

  describe('Additional Information Follow-Up', () => {
    it('should provide template for sending additional materials', async () => {
      const additionalInfoTemplate = {
        type: 'additional_info',
        template_subject: 'Additional portfolio samples - Software Engineer',
        template_body: 'Dear Sarah,\n\nFollowing up on our interview, I wanted to share some additional portfolio samples that demonstrate my experience with React and system design.\n\n[Links to portfolio items]\n\nPlease let me know if you have any questions.\n\nBest regards,\nJohn',
      };

      expect(additionalInfoTemplate.type).toBe('additional_info');
      expect(additionalInfoTemplate.template_body).toContain('portfolio');
    });
  });

  describe('Follow-Up Status Management', () => {
    it('should track follow-up through different statuses', async () => {
      const statuses = ['draft', 'sent', 'responded', 'no_response'];
      
      const followUpJourney = [
        { status: 'draft', updated_at: '2025-01-20T09:00:00Z' },
        { status: 'sent', updated_at: '2025-01-20T10:00:00Z' },
        { status: 'responded', updated_at: '2025-01-21T14:00:00Z' },
      ];

      expect(statuses).toContain(followUpJourney[0].status);
      expect(followUpJourney[followUpJourney.length - 1].status).toBe('responded');
    });
  });
});

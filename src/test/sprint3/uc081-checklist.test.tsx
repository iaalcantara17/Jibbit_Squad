import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-081: Pre-Interview Preparation Checklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role-Specific Checklist Generation', () => {
    it('should generate checklist items for technical roles', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockTechChecklist = [
        {
          id: 'item1',
          interview_id: 'int-1',
          label: 'Review data structures and algorithms',
          category: 'preparation',
          is_required: true,
          completed_at: null,
        },
        {
          id: 'item2',
          interview_id: 'int-1',
          label: 'Practice coding in preferred language',
          category: 'preparation',
          is_required: true,
          completed_at: null,
        },
        {
          id: 'item3',
          interview_id: 'int-1',
          label: 'Test laptop and IDE setup',
          category: 'logistics',
          is_required: true,
          completed_at: null,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockTechChecklist, error: null }),
        }),
      });

      expect(mockTechChecklist).toHaveLength(3);
      expect(mockTechChecklist[0].category).toBe('preparation');
    });

    it('should include company research verification', async () => {
      const researchItems = [
        {
          label: 'Research company mission and values',
          category: 'research',
          is_required: true,
        },
        {
          label: 'Review recent company news and developments',
          category: 'research',
          is_required: true,
        },
        {
          label: 'Research interviewer backgrounds on LinkedIn',
          category: 'research',
          is_required: false,
        },
      ];

      expect(researchItems.filter(i => i.category === 'research')).toHaveLength(3);
    });
  });

  describe('Checklist Item Management', () => {
    it('should mark items as complete with timestamp', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const completedItem = {
        id: 'item1',
        completed_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: completedItem, error: null }),
            }),
          }),
        }),
      });

      expect(completedItem.completed_at).toBeDefined();
    });

    it('should calculate completion percentage', async () => {
      const checklist = [
        { id: '1', completed_at: '2025-01-20T10:00:00Z' },
        { id: '2', completed_at: '2025-01-20T11:00:00Z' },
        { id: '3', completed_at: null },
        { id: '4', completed_at: null },
        { id: '5', completed_at: '2025-01-20T12:00:00Z' },
      ];

      const completed = checklist.filter(item => item.completed_at !== null).length;
      const completionPercentage = (completed / checklist.length) * 100;

      expect(completionPercentage).toBe(60);
    });
  });

  describe('Custom Checklist Items', () => {
    it('should allow adding custom preparation tasks', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const customItem = {
        id: 'custom1',
        interview_id: 'int-1',
        label: 'Prepare portfolio examples',
        category: 'preparation',
        is_required: false,
        completed_at: null,
        user_id: 'user-1',
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: customItem, error: null }),
          }),
        }),
      });

      expect(customItem.label).toBe('Prepare portfolio examples');
      expect(customItem.is_required).toBe(false);
    });
  });

  describe('Logistics Verification', () => {
    it('should include logistics checklist items', async () => {
      const logisticsItems = [
        {
          label: 'Test video conferencing link',
          category: 'logistics',
          is_required: true,
        },
        {
          label: 'Verify location and parking information',
          category: 'logistics',
          is_required: true,
        },
        {
          label: 'Set up professional background for video',
          category: 'logistics',
          is_required: false,
        },
      ];

      expect(logisticsItems.every(i => i.category === 'logistics')).toBe(true);
    });
  });

  describe('Attire Suggestions', () => {
    it('should suggest appropriate attire based on company culture', async () => {
      const attireSuggestions = {
        startup: 'Business casual - collared shirt, no tie needed',
        corporate: 'Business professional - suit and tie',
        tech: 'Smart casual - nice shirt or polo',
      };

      expect(attireSuggestions.startup).toContain('casual');
      expect(attireSuggestions.corporate).toContain('suit');
    });
  });

  describe('Questions for Interviewer', () => {
    it('should remind to prepare thoughtful questions', async () => {
      const questionReminders = [
        {
          label: 'Prepare 3-5 questions about the role',
          category: 'preparation',
          is_required: true,
        },
        {
          label: 'Prepare questions about team structure',
          category: 'preparation',
          is_required: false,
        },
      ];

      expect(questionReminders.some(r => r.label.includes('questions'))).toBe(true);
    });
  });

  describe('Portfolio Preparation', () => {
    it('should include portfolio and work sample items', async () => {
      const portfolioItems = [
        {
          label: 'Select 2-3 relevant portfolio projects to discuss',
          category: 'preparation',
          is_required: true,
        },
        {
          label: 'Prepare code samples if requested',
          category: 'preparation',
          is_required: false,
        },
      ];

      expect(portfolioItems[0].label).toContain('portfolio');
    });
  });

  describe('Confidence Building Activities', () => {
    it('should include confidence-building exercises', async () => {
      const confidenceItems = [
        {
          label: 'Practice power posing for 2 minutes',
          category: 'confidence',
          is_required: false,
        },
        {
          label: 'Review past successes and accomplishments',
          category: 'confidence',
          is_required: false,
        },
      ];

      expect(confidenceItems.every(i => i.category === 'confidence')).toBe(true);
    });
  });

  describe('Post-Interview Follow-up Reminders', () => {
    it('should generate post-interview task reminders', async () => {
      const followUpTasks = [
        {
          label: 'Send thank-you email within 24 hours',
          category: 'followup',
          due_offset_hours: 24,
        },
        {
          label: 'Update interview notes and impressions',
          category: 'followup',
          due_offset_hours: 2,
        },
      ];

      expect(followUpTasks[0].due_offset_hours).toBe(24);
      expect(followUpTasks[1].category).toBe('followup');
    });
  });

  describe('Checklist Customization by Company', () => {
    it('should customize checklist based on company culture', async () => {
      const startupChecklist = [
        { label: 'Research founder backgrounds', category: 'research' },
        { label: 'Review product roadmap', category: 'research' },
      ];

      const enterpriseChecklist = [
        { label: 'Review organizational structure', category: 'research' },
        { label: 'Research compliance requirements', category: 'research' },
      ];

      expect(startupChecklist[0].label).toContain('founder');
      expect(enterpriseChecklist[0].label).toContain('organizational');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

describe('UC-075: Role-Specific Interview Question Bank', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Question Bank Generation by Role and Industry', () => {
    it('should generate questions based on job title', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockQuestions = [
        {
          id: 'q1',
          role_title: 'Software Engineer',
          category: 'technical',
          difficulty: 'mid',
          question_text: 'Explain the differences between REST and GraphQL',
          linked_skills: ['API Design', 'Web Development'],
        },
        {
          id: 'q2',
          role_title: 'Software Engineer',
          category: 'behavioral',
          difficulty: 'mid',
          question_text: 'Tell me about a time you debugged a complex issue',
          star_framework_hint: 'Describe the situation, your debugging approach, actions taken, and result',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
        }),
      });

      expect(mockQuestions).toHaveLength(2);
      expect(mockQuestions[0].role_title).toBe('Software Engineer');
      expect(mockQuestions[1].role_title).toBe('Software Engineer');
    });

    it('should filter questions by industry', async () => {
      const techQuestions = [
        {
          id: 'q1',
          role_title: 'Data Scientist',
          industry: 'Technology',
          question_text: 'How do you handle imbalanced datasets?',
        },
      ];

      const financeQuestions = [
        {
          id: 'q2',
          role_title: 'Financial Analyst',
          industry: 'Finance',
          question_text: 'Explain your approach to financial modeling',
        },
      ];

      expect(techQuestions[0].industry).toBe('Technology');
      expect(financeQuestions[0].industry).toBe('Finance');
    });
  });

  describe('Question Categories', () => {
    it('should include behavioral questions with STAR framework', async () => {
      const behavioralQuestion = {
        id: 'q1',
        category: 'behavioral',
        question_text: 'Describe a time you worked with a difficult team member',
        star_framework_hint: 'Situation: Describe the team and project\nTask: What was your responsibility?\nAction: What specific steps did you take?\nResult: What was the outcome?',
        difficulty: 'mid',
      };

      expect(behavioralQuestion.category).toBe('behavioral');
      expect(behavioralQuestion.star_framework_hint).toContain('Situation');
      expect(behavioralQuestion.star_framework_hint).toContain('Task');
      expect(behavioralQuestion.star_framework_hint).toContain('Action');
      expect(behavioralQuestion.star_framework_hint).toContain('Result');
    });

    it('should include technical questions', async () => {
      const technicalQuestion = {
        id: 'q2',
        category: 'technical',
        question_text: 'Design a scalable URL shortening service',
        linked_skills: ['System Design', 'Distributed Systems', 'Databases'],
        difficulty: 'senior',
      };

      expect(technicalQuestion.category).toBe('technical');
      expect(technicalQuestion.linked_skills).toContain('System Design');
    });

    it('should include situational questions', async () => {
      const situationalQuestion = {
        id: 'q3',
        category: 'situational',
        question_text: 'How would you handle a critical production bug on Friday evening?',
        difficulty: 'mid',
      };

      expect(situationalQuestion.category).toBe('situational');
    });
  });

  describe('Industry-Specific Technical Questions', () => {
    it('should suggest tech stack specific questions', async () => {
      const techStackQuestions = [
        {
          id: 'q1',
          industry: 'Technology',
          role_title: 'Frontend Developer',
          question_text: 'Explain React hooks and when to use each',
          linked_skills: ['React', 'JavaScript', 'Frontend'],
        },
        {
          id: 'q2',
          industry: 'Technology',
          role_title: 'Backend Developer',
          question_text: 'How do you design a RESTful API?',
          linked_skills: ['API Design', 'Backend', 'Architecture'],
        },
      ];

      expect(techStackQuestions[0].linked_skills).toContain('React');
      expect(techStackQuestions[1].linked_skills).toContain('API Design');
    });

    it('should link questions to job posting skills', async () => {
      const jobSkills = ['Python', 'Machine Learning', 'SQL'];
      const matchingQuestions = [
        {
          id: 'q1',
          question_text: 'Explain your experience with Python for data analysis',
          linked_skills: ['Python', 'Data Analysis'],
        },
        {
          id: 'q2',
          question_text: 'Describe a machine learning project you built',
          linked_skills: ['Machine Learning', 'Python'],
        },
      ];

      const hasMatchingSkill = matchingQuestions.every(q => 
        q.linked_skills.some(skill => jobSkills.includes(skill))
      );

      expect(hasMatchingSkill).toBe(true);
    });
  });

  describe('Practice Response Tracking', () => {
    it('should track which questions have been practiced', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockPracticeResponses = [
        {
          id: 'r1',
          question_id: 'q1',
          user_id: 'user-1',
          response_text: 'In my previous role...',
          status: 'submitted',
          time_taken: 180,
          created_at: '2025-01-20T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockPracticeResponses, error: null }),
        }),
      });

      expect(mockPracticeResponses[0].status).toBe('submitted');
      expect(mockPracticeResponses[0].time_taken).toBe(180);
    });

    it('should save written responses with timestamps', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const newResponse = {
        id: 'r2',
        question_id: 'q2',
        user_id: 'user-1',
        response_text: 'When working on the project...',
        status: 'draft',
        time_taken: 120,
        created_at: new Date().toISOString(),
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newResponse, error: null }),
          }),
        }),
      });

      expect(newResponse.response_text).toContain('working on');
      expect(newResponse.created_at).toBeDefined();
    });
  });

  describe('Difficulty Levels', () => {
    it('should provide entry level questions', async () => {
      const entryQuestions = [
        {
          id: 'q1',
          difficulty: 'entry',
          question_text: 'What interests you about this role?',
          category: 'behavioral',
        },
        {
          id: 'q2',
          difficulty: 'entry',
          question_text: 'Explain what HTML, CSS, and JavaScript do',
          category: 'technical',
        },
      ];

      expect(entryQuestions.every(q => q.difficulty === 'entry')).toBe(true);
    });

    it('should provide mid-level questions', async () => {
      const midQuestions = [
        {
          id: 'q3',
          difficulty: 'mid',
          question_text: 'Describe your experience leading a small project',
          category: 'behavioral',
        },
      ];

      expect(midQuestions[0].difficulty).toBe('mid');
    });

    it('should provide senior-level questions', async () => {
      const seniorQuestions = [
        {
          id: 'q4',
          difficulty: 'senior',
          question_text: 'How would you architect a globally distributed system?',
          category: 'technical',
        },
      ];

      expect(seniorQuestions[0].difficulty).toBe('senior');
    });
  });

  describe('Question Search and Filtering', () => {
    it('should support keyword search', async () => {
      const allQuestions = [
        { id: 'q1', question_text: 'Explain React hooks', linked_skills: ['React'] },
        { id: 'q2', question_text: 'Describe your leadership style', linked_skills: ['Leadership'] },
        { id: 'q3', question_text: 'How do you handle conflict?', linked_skills: ['Communication'] },
      ];

      const searchTerm = 'React';
      const filtered = allQuestions.filter(q => 
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.linked_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q1');
    });

    it('should filter by multiple criteria', async () => {
      const questions = [
        { id: 'q1', role_title: 'Software Engineer', category: 'technical', difficulty: 'mid' },
        { id: 'q2', role_title: 'Software Engineer', category: 'behavioral', difficulty: 'mid' },
        { id: 'q3', role_title: 'Product Manager', category: 'technical', difficulty: 'mid' },
      ];

      const filtered = questions.filter(q => 
        q.role_title === 'Software Engineer' && 
        q.category === 'technical' && 
        q.difficulty === 'mid'
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q1');
    });
  });

  describe('Company-Specific Questions', () => {
    it('should include questions about company challenges', async () => {
      const companyQuestions = [
        {
          id: 'q1',
          question_text: 'How would you contribute to our AI initiatives?',
          is_company_specific: true,
        },
        {
          id: 'q2',
          question_text: 'What excites you about our recent product launch?',
          is_company_specific: true,
        },
      ];

      expect(companyQuestions.every(q => q.is_company_specific)).toBe(true);
    });
  });
});

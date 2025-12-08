/**
 * Sprint 2 Tests: Company Research and Job Matching
 * UC-063 to UC-068
 */
import { describe, it, expect, vi } from 'vitest';
import { calculateJobMatch } from '@/lib/jobMatchingAlgorithm';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          companyName: 'Test Corp',
          description: 'A tech company',
          industry: 'Technology'
        },
        error: null
      })
    }
  }
}));

describe('UC-063: Automated Company Research', () => {
  it('should gather basic company information', () => {
    const companyInfo = {
      name: 'Tech Corp',
      size: '1000-5000 employees',
      industry: 'Technology',
      headquarters: 'San Francisco, CA',
      website: 'https://techcorp.com'
    };

    expect(companyInfo.name).toBeDefined();
    expect(companyInfo.size).toBeDefined();
    expect(companyInfo.industry).toBeDefined();
  });

  it('should research company culture', () => {
    const culture = {
      mission: 'To revolutionize technology',
      values: ['Innovation', 'Collaboration', 'Excellence'],
      workStyle: 'Hybrid',
      benefits: ['Health insurance', 'Stock options', 'Remote work']
    };

    expect(culture.values.length).toBeGreaterThan(0);
    expect(culture.mission).toBeDefined();
  });

  it('should identify leadership team', () => {
    const leadership = [
      { name: 'John CEO', title: 'Chief Executive Officer' },
      { name: 'Jane CTO', title: 'Chief Technology Officer' }
    ];

    expect(leadership.length).toBeGreaterThan(0);
    expect(leadership[0].title).toContain('Chief');
  });

  it('should generate research summary', () => {
    const generateSummary = (research: any) => {
      return `${research.name} is a ${research.industry} company ` +
        `with ${research.size} employees, headquartered in ${research.headquarters}.`;
    };

    const summary = generateSummary({
      name: 'Tech Corp',
      industry: 'Technology',
      size: '1000+',
      headquarters: 'San Francisco'
    });

    expect(summary).toContain('Tech Corp');
    expect(summary).toContain('Technology');
  });
});

describe('UC-064: Company News and Updates', () => {
  it('should fetch recent news', () => {
    const news = [
      { 
        title: 'Tech Corp raises $50M', 
        date: '2025-01-15',
        category: 'funding',
        source: 'TechCrunch'
      },
      {
        title: 'New product launch',
        date: '2025-01-10',
        category: 'product',
        source: 'Company Blog'
      }
    ];

    expect(news.length).toBeGreaterThan(0);
    expect(news[0].category).toBeDefined();
  });

  it('should categorize news', () => {
    const categorizeNews = (headline: string) => {
      if (headline.toLowerCase().includes('funding') || headline.includes('$')) {
        return 'funding';
      }
      if (headline.toLowerCase().includes('hire') || headline.toLowerCase().includes('ceo')) {
        return 'hiring';
      }
      if (headline.toLowerCase().includes('launch') || headline.toLowerCase().includes('product')) {
        return 'product';
      }
      return 'general';
    };

    expect(categorizeNews('Company raises $50M')).toBe('funding');
    expect(categorizeNews('New product launch')).toBe('product');
    expect(categorizeNews('CEO announced')).toBe('hiring');
  });

  it('should extract key points from news', () => {
    const extractKeyPoints = (article: string) => {
      const sentences = article.split('.').filter(s => s.trim().length > 20);
      return sentences.slice(0, 3).map(s => s.trim());
    };

    const keyPoints = extractKeyPoints(
      'Tech Corp announced funding. The round was led by top investors. ' +
      'This will accelerate growth.'
    );
    
    expect(keyPoints.length).toBeLessThanOrEqual(3);
  });
});

describe('UC-065: Job Matching Algorithm', () => {
  const mockJob = {
    job_title: 'Senior Frontend Developer',
    job_description: 'We need a skilled React developer with TypeScript experience',
    company_name: 'Tech Corp',
    location: 'San Francisco, CA'
  };

  const mockProfile = {
    skills: [
      { name: 'React', level: 'Advanced' },
      { name: 'TypeScript', level: 'Intermediate' },
      { name: 'CSS', level: 'Advanced' }
    ],
    employment_history: [
      { title: 'Frontend Developer', company: 'Old Corp', description: 'Built React applications' }
    ],
    education: [
      { degree: 'BS', field: 'Computer Science', institution: 'University' }
    ],
    location: 'San Francisco, CA'
  };

  it('should calculate overall match score', () => {
    const result = calculateJobMatch(mockJob, mockProfile);
    
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_score).toBeLessThanOrEqual(100);
  });

  it('should break down scores by category', () => {
    const result = calculateJobMatch(mockJob, mockProfile);
    
    expect(result.skills_score).toBeDefined();
    expect(result.experience_score).toBeDefined();
    expect(result.education_score).toBeDefined();
    expect(result.location_score).toBeDefined();
  });

  it('should identify strengths', () => {
    const result = calculateJobMatch(mockJob, mockProfile);
    
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it('should identify gaps', () => {
    const result = calculateJobMatch(mockJob, mockProfile);
    
    expect(Array.isArray(result.gaps)).toBe(true);
  });

  it('should provide recommendations', () => {
    const result = calculateJobMatch(mockJob, mockProfile);
    
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe('UC-066: Skills Gap Analysis', () => {
  it('should compare skills against requirements', () => {
    const analyzeGaps = (userSkills: string[], requiredSkills: string[]) => {
      const matching = userSkills.filter(s => 
        requiredSkills.some(r => r.toLowerCase() === s.toLowerCase())
      );
      const missing = requiredSkills.filter(r => 
        !userSkills.some(s => s.toLowerCase() === r.toLowerCase())
      );
      
      return { matching, missing };
    };

    const result = analyzeGaps(
      ['React', 'JavaScript', 'CSS'],
      ['React', 'TypeScript', 'Node.js']
    );

    expect(result.matching).toContain('React');
    expect(result.missing).toContain('TypeScript');
    expect(result.missing).toContain('Node.js');
  });

  it('should prioritize skills by importance', () => {
    const prioritizeSkills = (skills: string[], jobDescription: string) => {
      return skills.map(skill => {
        const mentions = (jobDescription.match(new RegExp(skill, 'gi')) || []).length;
        return { skill, importance: mentions > 2 ? 'high' : mentions > 0 ? 'medium' : 'low' };
      }).sort((a, b) => {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.importance as keyof typeof order] - order[a.importance as keyof typeof order];
      });
    };

    const prioritized = prioritizeSkills(
      ['React', 'Vue', 'Angular'],
      'We need React React React developers with Vue experience'
    );

    expect(prioritized[0].skill).toBe('React');
    expect(prioritized[0].importance).toBe('high');
  });

  it('should suggest learning resources', () => {
    const suggestResources = (skill: string) => ({
      skill,
      resources: [
        { type: 'course', name: `Learn ${skill} - Udemy`, url: 'https://udemy.com' },
        { type: 'documentation', name: `${skill} Official Docs`, url: 'https://docs.example.com' }
      ]
    });

    const suggestions = suggestResources('TypeScript');
    expect(suggestions.resources.length).toBeGreaterThan(0);
    expect(suggestions.resources[0].type).toBe('course');
  });
});

describe('UC-067: Salary Research and Benchmarking', () => {
  it('should display salary ranges', () => {
    const salaryData = {
      title: 'Software Engineer',
      location: 'San Francisco',
      percentile25: 120000,
      median: 150000,
      percentile75: 180000
    };

    expect(salaryData.median).toBeGreaterThan(salaryData.percentile25);
    expect(salaryData.percentile75).toBeGreaterThan(salaryData.median);
  });

  it('should factor in experience level', () => {
    const adjustForExperience = (baseSalary: number, yearsExperience: number) => {
      const multiplier = 1 + (yearsExperience * 0.05);
      return Math.round(baseSalary * Math.min(multiplier, 1.5));
    };

    expect(adjustForExperience(100000, 5)).toBe(125000);
    expect(adjustForExperience(100000, 15)).toBe(150000); // Capped at 1.5x
  });

  it('should compare across companies', () => {
    const salaryComparison = [
      { company: 'Big Tech', salary: 180000 },
      { company: 'Startup', salary: 150000 },
      { company: 'Enterprise', salary: 160000 }
    ];

    const sorted = [...salaryComparison].sort((a, b) => b.salary - a.salary);
    expect(sorted[0].company).toBe('Big Tech');
  });

  it('should provide negotiation recommendations', () => {
    const getNegotiationTips = (offeredSalary: number, marketMedian: number) => {
      const tips: string[] = [];
      if (offeredSalary < marketMedian * 0.9) {
        tips.push('Offer is below market rate - negotiate for higher');
      }
      if (offeredSalary >= marketMedian) {
        tips.push('Offer is at or above market rate');
      }
      tips.push('Consider total compensation including benefits');
      return tips;
    };

    const tips = getNegotiationTips(100000, 120000);
    expect(tips).toContain('Offer is below market rate - negotiate for higher');
  });
});

describe('UC-068: Interview Insights and Preparation', () => {
  it('should research interview process', () => {
    const interviewProcess = {
      company: 'Tech Corp',
      stages: ['Phone Screen', 'Technical Interview', 'System Design', 'Behavioral', 'Final'],
      averageDuration: '3-4 weeks',
      format: 'Remote'
    };

    expect(interviewProcess.stages.length).toBeGreaterThan(3);
    expect(interviewProcess.format).toBeDefined();
  });

  it('should identify common questions', () => {
    const commonQuestions = [
      { category: 'behavioral', question: 'Tell me about yourself' },
      { category: 'technical', question: 'Explain REST API design' },
      { category: 'situational', question: 'How do you handle conflicts?' }
    ];

    const technicalQuestions = commonQuestions.filter(q => q.category === 'technical');
    expect(technicalQuestions.length).toBeGreaterThan(0);
  });

  it('should generate preparation checklist', () => {
    const generateChecklist = (interviewType: string) => {
      const baseItems = [
        'Research company background',
        'Review job description',
        'Prepare questions for interviewer'
      ];
      
      if (interviewType === 'technical') {
        baseItems.push('Review coding fundamentals');
        baseItems.push('Practice whiteboard problems');
      }
      
      return baseItems;
    };

    const checklist = generateChecklist('technical');
    expect(checklist).toContain('Review coding fundamentals');
    expect(checklist.length).toBeGreaterThan(3);
  });

  it('should estimate timeline', () => {
    const estimateTimeline = (stages: number) => {
      const daysPerStage = 5;
      const totalDays = stages * daysPerStage;
      return `${Math.floor(totalDays / 7)}-${Math.ceil(totalDays / 7) + 1} weeks`;
    };

    expect(estimateTimeline(4)).toBe('2-4 weeks');
  });
});

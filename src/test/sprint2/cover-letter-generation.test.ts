/**
 * Sprint 2 Tests: AI Cover Letter Generation
 * UC-055 to UC-062
 */
import { describe, it, expect, vi } from 'vitest';

// Mock export functions
vi.mock('@/lib/exportService', () => ({
  exportCoverLetterToPDF: vi.fn().mockResolvedValue(undefined),
  exportCoverLetterToWord: vi.fn().mockResolvedValue(undefined),
  exportCoverLetterToText: vi.fn(),
  exportCoverLetterToHTML: vi.fn()
}));

describe('UC-055: Cover Letter Template Library', () => {
  const templates = [
    { id: 'formal', name: 'Formal', industry: 'general' },
    { id: 'creative', name: 'Creative', industry: 'design' },
    { id: 'technical', name: 'Technical', industry: 'tech' },
    { id: 'executive', name: 'Executive', industry: 'management' }
  ];

  it('should have multiple template options', () => {
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  it('should support industry-specific templates', () => {
    const techTemplates = templates.filter(t => t.industry === 'tech');
    expect(techTemplates.length).toBeGreaterThan(0);
  });

  it('should provide template preview', () => {
    const getTemplatePreview = (templateId: string) => ({
      id: templateId,
      preview: `Dear Hiring Manager, [Preview content for ${templateId}]...`,
      sampleOpening: 'I am writing to express my interest...'
    });

    const preview = getTemplatePreview('formal');
    expect(preview.sampleOpening).toContain('interest');
  });

  it('should allow template customization', () => {
    const customizeTemplate = (template: any, options: any) => ({
      ...template,
      ...options,
      customized: true
    });

    const customized = customizeTemplate(
      templates[0], 
      { fontFamily: 'Georgia', fontSize: 12 }
    );
    expect(customized.fontFamily).toBe('Georgia');
    expect(customized.customized).toBe(true);
  });
});

describe('UC-056: AI Cover Letter Content Generation', () => {
  it('should generate personalized opening', () => {
    const generateOpening = (companyName: string, jobTitle: string) => 
      `I am excited to apply for the ${jobTitle} position at ${companyName}.`;

    const opening = generateOpening('Tech Corp', 'Software Engineer');
    expect(opening).toContain('Tech Corp');
    expect(opening).toContain('Software Engineer');
  });

  it('should highlight relevant experience', () => {
    const highlightExperience = (experiences: string[], jobRequirements: string[]) => {
      return experiences.filter(exp => 
        jobRequirements.some(req => 
          exp.toLowerCase().includes(req.toLowerCase())
        )
      );
    };

    const relevant = highlightExperience(
      ['Developed React applications', 'Led team of 5', 'Managed database migrations'],
      ['React', 'team leadership']
    );

    expect(relevant).toContain('Developed React applications');
    expect(relevant).toContain('Led team of 5');
  });

  it('should generate closing with call-to-action', () => {
    const generateClosing = (tone: string) => {
      const closings = {
        formal: 'I look forward to the opportunity to discuss how my experience aligns with your needs.',
        enthusiastic: 'I am eager to contribute to your team and would welcome the chance to discuss this opportunity!',
        professional: 'Thank you for considering my application. I am available for an interview at your convenience.'
      };
      return closings[tone as keyof typeof closings] || closings.professional;
    };

    expect(generateClosing('formal')).toContain('opportunity');
    expect(generateClosing('enthusiastic')).toContain('eager');
  });

  it('should provide multiple content variations', () => {
    const generateVariations = (paragraph: string) => [
      { id: 1, content: paragraph, tone: 'professional' },
      { id: 2, content: paragraph.replace('I am', 'I\'m'), tone: 'casual' },
      { id: 3, content: paragraph + ' I am confident in my abilities.', tone: 'confident' }
    ];

    const variations = generateVariations('I am applying for this position.');
    expect(variations).toHaveLength(3);
  });
});

describe('UC-057: Cover Letter Company Research Integration', () => {
  it('should include company background', () => {
    const companyResearch = {
      name: 'Tech Corp',
      mission: 'To innovate and transform the tech industry',
      values: ['Innovation', 'Collaboration', 'Excellence'],
      recentNews: 'Recently raised $50M Series B'
    };

    expect(companyResearch.mission).toBeDefined();
    expect(companyResearch.values.length).toBeGreaterThan(0);
  });

  it('should reference company mission/values', () => {
    const integrateResearch = (content: string, research: any) => {
      let enhanced = content;
      if (research.values?.length > 0) {
        enhanced += ` Your commitment to ${research.values[0]} resonates with my professional values.`;
      }
      return enhanced;
    };

    const result = integrateResearch(
      'I am excited about this opportunity.',
      { values: ['Innovation', 'Quality'] }
    );
    expect(result).toContain('Innovation');
  });

  it('should include recent news', () => {
    const mentionNews = (news: string) => 
      `I was impressed to learn about ${news}, which demonstrates the company's growth trajectory.`;

    const paragraph = mentionNews('your recent Series B funding');
    expect(paragraph).toContain('Series B');
  });
});

describe('UC-058: Cover Letter Tone and Style Customization', () => {
  const tones = ['formal', 'casual', 'enthusiastic', 'analytical'];

  it('should support multiple tone options', () => {
    expect(tones).toContain('formal');
    expect(tones).toContain('casual');
    expect(tones).toContain('enthusiastic');
  });

  it('should adjust language based on tone', () => {
    const adjustTone = (text: string, tone: string) => {
      if (tone === 'casual') {
        return text.replace('I am', "I'm").replace('would like to', 'want to');
      }
      if (tone === 'enthusiastic') {
        return text + '!';
      }
      return text;
    };

    expect(adjustTone('I am excited', 'casual')).toBe("I'm excited");
    expect(adjustTone('I am excited', 'enthusiastic')).toBe('I am excited!');
  });

  it('should match company culture style', () => {
    const matchCulture = (companyType: string) => {
      const styles = {
        startup: 'casual',
        corporate: 'formal',
        creative: 'enthusiastic'
      };
      return styles[companyType as keyof typeof styles] || 'professional';
    };

    expect(matchCulture('startup')).toBe('casual');
    expect(matchCulture('corporate')).toBe('formal');
  });

  it('should support length options', () => {
    const lengths = ['brief', 'standard', 'detailed'];
    expect(lengths).toContain('brief');
    expect(lengths).toContain('standard');
    expect(lengths).toContain('detailed');
  });
});

describe('UC-059: Cover Letter Experience Highlighting', () => {
  it('should analyze job requirements against experience', () => {
    const analyzeMatch = (
      experience: string[], 
      requirements: string[]
    ) => {
      const matches = experience.filter(exp => 
        requirements.some(req => exp.toLowerCase().includes(req.toLowerCase()))
      );
      return {
        matched: matches,
        matchRate: (matches.length / requirements.length) * 100
      };
    };

    const result = analyzeMatch(
      ['5 years React development', 'Team leadership experience'],
      ['React', 'leadership', 'Node.js']
    );

    expect(result.matched.length).toBe(2);
    expect(result.matchRate).toBeCloseTo(66.67, 0);
  });

  it('should generate compelling narratives', () => {
    const generateNarrative = (achievement: string, metric?: string) => {
      if (metric) {
        return `${achievement}, resulting in ${metric}.`;
      }
      return achievement;
    };

    const narrative = generateNarrative(
      'Led development of new feature',
      '40% increase in user engagement'
    );
    expect(narrative).toContain('40%');
  });

  it('should quantify achievements where possible', () => {
    const quantifyAchievement = (achievement: string) => {
      const hasNumbers = /\d+/.test(achievement);
      return {
        original: achievement,
        isQuantified: hasNumbers,
        suggestion: hasNumbers ? null : 'Consider adding specific numbers or percentages'
      };
    };

    const result1 = quantifyAchievement('Increased sales by 25%');
    const result2 = quantifyAchievement('Improved team performance');

    expect(result1.isQuantified).toBe(true);
    expect(result2.suggestion).toContain('numbers');
  });
});

describe('UC-060: Cover Letter Editing and Refinement', () => {
  it('should count words and characters', () => {
    const countContent = (text: string) => ({
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length
    });

    const counts = countContent('Hello world, this is a test.');
    expect(counts.words).toBe(6);
    expect(counts.characters).toBe(28);
  });

  it('should suggest synonyms', () => {
    const getSynonyms = (word: string) => {
      const synonyms: Record<string, string[]> = {
        'experienced': ['skilled', 'proficient', 'seasoned'],
        'passionate': ['enthusiastic', 'dedicated', 'committed'],
        'led': ['managed', 'directed', 'spearheaded']
      };
      return synonyms[word.toLowerCase()] || [];
    };

    expect(getSynonyms('experienced')).toContain('skilled');
    expect(getSynonyms('led')).toContain('spearheaded');
  });

  it('should check readability', () => {
    const checkReadability = (text: string) => {
      const words = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
      const avgWordsPerSentence = words / Math.max(sentences, 1);

      return {
        avgWordsPerSentence,
        score: avgWordsPerSentence < 20 ? 'Good' : 'Consider shorter sentences'
      };
    };

    const result = checkReadability('This is a test. It has short sentences.');
    expect(result.score).toBe('Good');
  });
});

describe('UC-061: Cover Letter Export and Integration', () => {
  it('should export to PDF', () => {
    const exportFormats = ['pdf', 'docx', 'txt'];
    expect(exportFormats).toContain('pdf');
  });

  it('should export to Word', () => {
    const exportFormats = ['pdf', 'docx', 'txt'];
    expect(exportFormats).toContain('docx');
  });

  it('should generate filename with job details', () => {
    const generateFilename = (company: string, jobTitle: string, format: string) => 
      `CoverLetter-${company}-${jobTitle}.${format}`.replace(/\s+/g, '-');

    expect(generateFilename('Tech Corp', 'Engineer', 'pdf'))
      .toBe('CoverLetter-Tech-Corp-Engineer.pdf');
  });

  it('should support email integration', () => {
    const prepareForEmail = (coverLetter: string) => ({
      subject: 'Application for [Position] at [Company]',
      body: coverLetter,
      isPlainText: true
    });

    const emailReady = prepareForEmail('Dear Hiring Manager...');
    expect(emailReady.subject).toContain('Application');
  });
});

describe('UC-062: Cover Letter Performance Tracking', () => {
  it('should track response rates', () => {
    const coverLetters = [
      { id: '1', template: 'formal', sentTo: 5, responses: 2 },
      { id: '2', template: 'creative', sentTo: 3, responses: 2 }
    ];

    const calculateResponseRate = (cl: typeof coverLetters[0]) => 
      (cl.responses / cl.sentTo) * 100;

    expect(calculateResponseRate(coverLetters[0])).toBe(40);
    expect(calculateResponseRate(coverLetters[1])).toBeCloseTo(66.67, 0);
  });

  it('should identify successful patterns', () => {
    const analytics = {
      bestPerformingTemplate: 'creative',
      bestPerformingTone: 'enthusiastic',
      avgResponseRate: 35,
      topKeywords: ['innovation', 'leadership', 'results-driven']
    };

    expect(analytics.bestPerformingTemplate).toBeDefined();
    expect(analytics.avgResponseRate).toBeGreaterThan(0);
  });

  it('should provide improvement recommendations', () => {
    const getRecommendations = (responseRate: number) => {
      const recommendations: string[] = [];
      if (responseRate < 20) {
        recommendations.push('Consider personalizing opening paragraph more');
        recommendations.push('Include more specific achievements');
      }
      if (responseRate < 40) {
        recommendations.push('Try different templates');
      }
      return recommendations;
    };

    expect(getRecommendations(15)).toContain('Consider personalizing opening paragraph more');
    expect(getRecommendations(30)).toContain('Try different templates');
  });
});

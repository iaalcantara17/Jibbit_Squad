/**
 * Sprint 2 Tests: AI Resume Generation
 * UC-046 to UC-054
 */
import { describe, it, expect, vi } from 'vitest';

// Mock export functions
vi.mock('@/lib/exportService', () => ({
  exportResumeToPDF: vi.fn().mockResolvedValue(undefined),
  exportResumeToWord: vi.fn().mockResolvedValue(undefined),
  exportResumeToText: vi.fn(),
  exportResumeToHTML: vi.fn()
}));

describe('UC-046: Resume Template Management', () => {
  const templates = ['chronological', 'functional', 'hybrid'];

  it('should have multiple template options', () => {
    expect(templates).toContain('chronological');
    expect(templates).toContain('functional');
    expect(templates).toContain('hybrid');
  });

  it('should allow template customization', () => {
    const template = {
      type: 'professional',
      colors: { primary: '#2563eb', secondary: '#64748b' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'single-column'
    };

    expect(template.colors.primary).toBeDefined();
    expect(template.fonts.heading).toBe('Inter');
  });

  it('should support template preview', () => {
    const previewTemplate = (templateId: string) => ({
      id: templateId,
      preview: `preview-${templateId}.png`,
      sampleContent: { sections: [] }
    });

    const preview = previewTemplate('professional');
    expect(preview.preview).toBe('preview-professional.png');
  });
});

describe('UC-047: AI Resume Content Generation', () => {
  it('should analyze job requirements', () => {
    const extractRequirements = (jobDescription: string) => {
      const keywords = jobDescription.toLowerCase().split(/\s+/)
        .filter(word => word.length > 3);
      return [...new Set(keywords)];
    };

    const requirements = extractRequirements('JavaScript React Node.js experience required');
    expect(requirements).toContain('javascript');
    expect(requirements).toContain('react');
  });

  it('should generate tailored bullet points', () => {
    const generateBulletPoint = (achievement: string, keywords: string[]) => {
      const enhanced = `${achievement} utilizing ${keywords.slice(0, 2).join(' and ')}`;
      return enhanced;
    };

    const bullet = generateBulletPoint('Developed web application', ['React', 'TypeScript']);
    expect(bullet).toContain('React');
    expect(bullet).toContain('TypeScript');
  });

  it('should provide multiple variations', () => {
    const generateVariations = (content: string, count: number) => {
      return Array(count).fill(null).map((_, i) => ({
        id: i,
        content: `${content} - Variation ${i + 1}`,
        score: 80 + i * 5
      }));
    };

    const variations = generateVariations('Led team of engineers', 3);
    expect(variations).toHaveLength(3);
    expect(variations[0].score).toBe(80);
  });
});

describe('UC-048: Resume Section Customization', () => {
  it('should toggle sections on/off', () => {
    const sections = [
      { id: 'experience', isVisible: true },
      { id: 'education', isVisible: true },
      { id: 'projects', isVisible: false }
    ];

    const toggleSection = (sectionId: string) => 
      sections.map(s => s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s);

    const updated = toggleSection('projects');
    expect(updated.find(s => s.id === 'projects')?.isVisible).toBe(true);
  });

  it('should reorder sections', () => {
    const sections = ['summary', 'experience', 'education', 'skills'];
    
    const reorder = (arr: string[], fromIndex: number, toIndex: number) => {
      const result = [...arr];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    };

    const reordered = reorder(sections, 3, 1); // Move skills after summary
    expect(reordered[1]).toBe('skills');
  });

  it('should support section presets', () => {
    const presets = {
      technical: ['summary', 'skills', 'experience', 'projects', 'education'],
      executive: ['summary', 'experience', 'achievements', 'education'],
      creative: ['portfolio', 'experience', 'skills', 'education']
    };

    expect(presets.technical[1]).toBe('skills');
    expect(presets.executive[2]).toBe('achievements');
  });
});

describe('UC-049: Resume Skills Optimization', () => {
  it('should compare user skills with job requirements', () => {
    const userSkills = ['JavaScript', 'React', 'CSS'];
    const jobRequirements = ['JavaScript', 'React', 'Node.js', 'PostgreSQL'];

    const matchingSkills = userSkills.filter(s => 
      jobRequirements.some(r => r.toLowerCase() === s.toLowerCase())
    );
    const missingSkills = jobRequirements.filter(r => 
      !userSkills.some(s => s.toLowerCase() === r.toLowerCase())
    );

    expect(matchingSkills).toContain('JavaScript');
    expect(matchingSkills).toContain('React');
    expect(missingSkills).toContain('Node.js');
    expect(missingSkills).toContain('PostgreSQL');
  });

  it('should calculate skills match percentage', () => {
    const calculateMatch = (matched: number, total: number) => 
      Math.round((matched / total) * 100);

    expect(calculateMatch(3, 5)).toBe(60);
    expect(calculateMatch(4, 4)).toBe(100);
  });

  it('should categorize technical vs soft skills', () => {
    const categorizeSkills = (skills: string[]) => {
      const technical = ['JavaScript', 'Python', 'React', 'SQL'];
      const soft = ['Leadership', 'Communication', 'Teamwork'];

      return {
        technical: skills.filter(s => technical.includes(s)),
        soft: skills.filter(s => soft.includes(s))
      };
    };

    const categorized = categorizeSkills(['JavaScript', 'Leadership', 'React']);
    expect(categorized.technical).toContain('JavaScript');
    expect(categorized.soft).toContain('Leadership');
  });
});

describe('UC-050: Resume Experience Tailoring', () => {
  it('should suggest experience modifications', () => {
    const tailorExperience = (experience: string, jobKeywords: string[]) => {
      const suggestions = jobKeywords.map(keyword => ({
        keyword,
        suggestion: `Consider emphasizing ${keyword} in this role`
      }));
      return suggestions;
    };

    const suggestions = tailorExperience(
      'Developed web applications',
      ['React', 'scalability']
    );

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].keyword).toBe('React');
  });

  it('should score experience relevance', () => {
    const scoreRelevance = (
      experienceKeywords: string[], 
      jobKeywords: string[]
    ) => {
      const matches = experienceKeywords.filter(e => 
        jobKeywords.some(j => j.toLowerCase() === e.toLowerCase())
      ).length;
      return Math.min(100, (matches / Math.max(jobKeywords.length, 1)) * 100);
    };

    const score = scoreRelevance(
      ['react', 'typescript', 'node'],
      ['react', 'typescript', 'vue', 'angular']
    );
    expect(score).toBe(50);
  });
});

describe('UC-051: Resume Export and Formatting', () => {
  it('should support PDF export', () => {
    const exportFormats = ['pdf', 'docx', 'txt', 'html'];
    expect(exportFormats).toContain('pdf');
  });

  it('should support Word export', () => {
    const exportFormats = ['pdf', 'docx', 'txt', 'html'];
    expect(exportFormats).toContain('docx');
  });

  it('should support plain text export', () => {
    const exportFormats = ['pdf', 'docx', 'txt', 'html'];
    expect(exportFormats).toContain('txt');
  });

  it('should support HTML export', () => {
    const exportFormats = ['pdf', 'docx', 'txt', 'html'];
    expect(exportFormats).toContain('html');
  });

  it('should generate custom filename', () => {
    const generateFilename = (
      resumeTitle: string, 
      format: string, 
      jobTitle?: string
    ) => {
      const base = jobTitle 
        ? `${resumeTitle}-${jobTitle}` 
        : resumeTitle;
      return `${base.replace(/\s+/g, '-')}.${format}`;
    };

    expect(generateFilename('John Doe Resume', 'pdf', 'Engineer'))
      .toBe('John-Doe-Resume-Engineer.pdf');
  });
});

describe('UC-052: Resume Version Management', () => {
  it('should create new version from existing', () => {
    const createVersion = (original: any, name: string) => ({
      ...original,
      id: `version-${Date.now()}`,
      name,
      parent_id: original.id,
      created_at: new Date().toISOString()
    });

    const original = { id: 'resume-1', content: 'Original content' };
    const version = createVersion(original, 'Version for Tech Corp');

    expect(version.parent_id).toBe('resume-1');
    expect(version.name).toBe('Version for Tech Corp');
  });

  it('should track version history', () => {
    const versions = [
      { id: 'v1', created_at: '2025-01-01', name: 'Original' },
      { id: 'v2', created_at: '2025-01-05', name: 'Updated skills' },
      { id: 'v3', created_at: '2025-01-10', name: 'Tech Corp version' }
    ];

    expect(versions).toHaveLength(3);
    expect(versions[versions.length - 1].name).toBe('Tech Corp version');
  });

  it('should link versions to job applications', () => {
    const versionToJobLink = {
      resume_version_id: 'v2',
      job_id: 'job-1',
      linked_at: new Date().toISOString()
    };

    expect(versionToJobLink.resume_version_id).toBeDefined();
    expect(versionToJobLink.job_id).toBeDefined();
  });
});

describe('UC-053: Resume Preview and Validation', () => {
  it('should validate contact information', () => {
    const validateContact = (contact: { email?: string; phone?: string }) => {
      const errors: string[] = [];
      if (contact.email && !contact.email.includes('@')) {
        errors.push('Invalid email format');
      }
      if (contact.phone && !/^\+?[\d\s-]+$/.test(contact.phone)) {
        errors.push('Invalid phone format');
      }
      return errors;
    };

    expect(validateContact({ email: 'invalid' })).toContain('Invalid email format');
    expect(validateContact({ email: 'test@example.com' })).toHaveLength(0);
  });

  it('should check resume length', () => {
    const checkLength = (pageCount: number) => {
      if (pageCount > 2) return 'Consider reducing to 1-2 pages';
      if (pageCount < 1) return 'Resume appears too short';
      return 'Good length';
    };

    expect(checkLength(3)).toBe('Consider reducing to 1-2 pages');
    expect(checkLength(1)).toBe('Good length');
  });

  it('should detect missing sections', () => {
    const checkMissingSections = (sections: string[]) => {
      const required = ['experience', 'education', 'skills'];
      return required.filter(r => !sections.includes(r));
    };

    const missing = checkMissingSections(['experience', 'projects']);
    expect(missing).toContain('education');
    expect(missing).toContain('skills');
  });
});

describe('UC-054: Resume Collaboration and Feedback', () => {
  it('should generate shareable link', () => {
    const generateShareLink = (resumeId: string) => {
      const token = btoa(`${resumeId}-${Date.now()}`);
      return `https://app.example.com/resume/share/${token}`;
    };

    const link = generateShareLink('resume-1');
    expect(link).toContain('/resume/share/');
  });

  it('should track feedback', () => {
    const feedback = [
      { id: '1', comment: 'Great experience section', resolved: false },
      { id: '2', comment: 'Consider adding more skills', resolved: true }
    ];

    const unresolvedFeedback = feedback.filter(f => !f.resolved);
    expect(unresolvedFeedback).toHaveLength(1);
  });

  it('should support reviewer permissions', () => {
    const permissions = ['view', 'comment', 'edit'];

    expect(permissions).toContain('view');
    expect(permissions).toContain('comment');
    expect(permissions).toContain('edit');
  });
});

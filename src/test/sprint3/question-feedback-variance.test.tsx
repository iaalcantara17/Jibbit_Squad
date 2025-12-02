import { describe, it, expect } from 'vitest';

describe('Question Feedback Score Variance', () => {
  const calculateScores = (responseText: string) => {
    const text = responseText.trim();
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const exampleIndicators = ['example', 'for instance', 'such as', 'specifically', 'in particular'];
    const exampleCount = exampleIndicators.filter(ind => text.toLowerCase().includes(ind)).length;
    
    const numberMatches = text.match(/\d+/g);
    const numberCount = numberMatches ? numberMatches.length : 0;
    
    const weakPhrases = ['maybe', 'i think', 'sort of', 'kind of', 'basically'];
    const weakLanguageCount = weakPhrases.filter(phrase => text.toLowerCase().includes(phrase)).length;
    
    const lengthScore = wordCount < 30 ? 3 : wordCount < 60 ? 5 : wordCount < 150 ? 8 : wordCount < 250 ? 7 : 5;
    const relevanceScore = Math.min(10, Math.max(3, lengthScore + (sentences.length > 3 ? 1 : 0)));
    const specificityScore = Math.min(10, 3 + (exampleCount * 2) + (numberCount > 0 ? 2 : 0) + (numberCount > 2 ? 1 : 0));
    
    const impactKeywords = ['improved', 'increased', 'reduced', 'saved', 'generated'];
    const impactCount = impactKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const impactScore = Math.min(10, 3 + (numberCount > 0 ? 3 : 0) + (impactCount * 2));
    
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    const clarityScore = Math.min(10, Math.max(3, 
      8 - (weakLanguageCount * 1) - (avgSentenceLength > 30 ? 1 : 0) + (avgSentenceLength > 10 && avgSentenceLength < 25 ? 1 : 0)
    ));
    
    const overallScore = Math.round(
      (relevanceScore * 0.25 + specificityScore * 0.25 + impactScore * 0.3 + clarityScore * 0.2)
    );
    
    return { relevanceScore, specificityScore, impactScore, clarityScore, overallScore };
  };

  it('should give LOW scores for short vague responses', () => {
    const shortVague = "I think maybe I did some work on a project. It was good.";
    const scores = calculateScores(shortVague);
    
    expect(scores.overallScore).toBeLessThan(6);
    expect(scores.specificityScore).toBeLessThan(6);
    expect(scores.impactScore).toBeLessThan(6);
  });

  it('should give HIGH scores for detailed STAR responses with metrics', () => {
    const detailedSTAR = "When I joined the team, we faced declining user engagement. I was tasked with improving retention by 20%. I implemented a comprehensive onboarding flow with personalized tutorials and progress tracking. For example, we A/B tested 3 different approaches with 5000 users each. Specifically, I created email campaigns that increased activation rates. As a result, we achieved a 35% increase in 30-day retention, improved user satisfaction scores by 4.5 points, and reduced churn by 25%. This generated an additional $2M in annual recurring revenue.";
    const scores = calculateScores(detailedSTAR);
    
    expect(scores.overallScore).toBeGreaterThan(7);
    expect(scores.specificityScore).toBeGreaterThan(7);
    expect(scores.impactScore).toBeGreaterThan(8);
  });

  it('should give MEDIUM scores for moderate responses', () => {
    const moderate = "I worked on improving the application performance. I implemented caching which helped reduce load times. The team was happy with the results.";
    const scores = calculateScores(moderate);
    
    expect(scores.overallScore).toBeGreaterThanOrEqual(5);
    expect(scores.overallScore).toBeLessThanOrEqual(7);
  });

  it('should NOT always return same scores', () => {
    const response1 = "Yes.";
    const response2 = "I worked on a project for 6 months where I improved system performance by implementing caching strategies, reducing API response times by 40%. For example, I optimized database queries which saved 200ms per request. This resulted in better user experience and increased customer satisfaction scores by 15%.";
    
    const scores1 = calculateScores(response1);
    const scores2 = calculateScores(response2);
    
    expect(scores1.overallScore).not.toBe(scores2.overallScore);
    expect(scores2.overallScore).toBeGreaterThan(scores1.overallScore);
    expect(Math.abs(scores2.overallScore - scores1.overallScore)).toBeGreaterThan(3);
  });

  it('should penalize weak language', () => {
    const withWeakLanguage = "I think maybe I sort of worked on the project. I basically did some coding and it was kind of successful.";
    const withoutWeakLanguage = "I worked on the project. I implemented new features and delivered successful results.";
    
    const scores1 = calculateScores(withWeakLanguage);
    const scores2 = calculateScores(withoutWeakLanguage);
    
    expect(scores2.clarityScore).toBeGreaterThan(scores1.clarityScore);
  });

  it('should reward specificity with examples and numbers', () => {
    const vague = "I improved the system and it worked better.";
    const specific = "I improved the system by implementing 3 specific optimizations: caching (reduced latency by 40%), query optimization (saved 200ms), and load balancing (handled 5000 requests/sec). For example, the caching layer used Redis with a 95% hit rate.";
    
    const scores1 = calculateScores(vague);
    const scores2 = calculateScores(specific);
    
    expect(scores2.specificityScore).toBeGreaterThan(scores1.specificityScore);
    expect(scores2.impactScore).toBeGreaterThan(scores1.impactScore);
  });
});
